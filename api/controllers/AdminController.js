module.exports = {

  index: function(req, res) {
    res.view({
      selectedPage: 'admin',
      breadcrumbs: [ { name: 'General' } ]
    });
  },

  general: function(req, res) {
    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'general',
      breadcrumbs: [ { name: 'General' } ]
    });
  },

  employees: function(req, res) {
    PopUser.many({company: req.session.userinfo.company.id}, {sort: 'lastName ASC'}, function (e, employees) {
      Permission.find({ companyId: req.session.userinfo.company.id }).exec(function(e, roles) {
        Invite.find({ invitedTo: req.session.userinfo.company.id }).populate('invitedRole').exec(function(e, invites) {
          res.view('admin/index', {
            selectedPage: 'admin',
            selectedSection: 'employees',
            breadcrumbs: [ { name: 'Employees' } ],
            employees: employees,
            allRoles: roles,
            allInvites: invites
          });
        });
      });
    });
  },

  do_invite: function(req, res) {
    if(!req.isSocket)
      return;

    var invitedEmail = req.param('email');
    var invitedRole = req.param('role');

    if(invitedEmail.indexOf('@') == -1 || invitedEmail.indexOf('@') == -1) {
      return res.json({ error: "invalid email format" });
    }

    Invite.findOne({ inviteEmail: invitedEmail.toLowerCase() }).exec(function(e, invites) {
      if(e || invites) {
        res.json({ error: "user was already invited" });
      } else {

        User.findOne({ email: invitedEmail }).exec(function(e, users) {
          if(e || users) {
            res.json({ error: "user already exists in db" });
          } else {

            Permission.findOne(invitedRole).exec(function(e, role) {
              if(e || !role) {
                res.json({ error: "role doesn't exist" });
              } else if(role.companyId != req.session.userinfo.company.id) {
                res.json({ error: "role doesn't belong to your company" });
              } else {
                Invite.create({
                  inviteEmail: invitedEmail.toLowerCase(),
                  invitedBy: req.session.userinfo.id,
                  invitedTo: req.session.userinfo.company.id,
                  invitedRole: invitedRole
                }).exec(function(e, inviteKey) {
                  // queue up email
                  QueueService.sendEmail({
                    template: 'welcome',
                    templateVars: {
                      invitedBy: req.session.userinfo.fullName,
                      inviteKey: inviteKey.id,
                      companyName: req.session.userinfo.company.name,
                      companyHost: req.session.userinfo.company.host
                    },
                    to: invitedEmail,
                    subject: "You've been invited to CozyHR!"
                  });
                  // done
                  res.json({
                    success: true,
                    email: invitedEmail,
                    token: inviteKey,
                    companyName: req.session.userinfo.company.name
                  });
                });
              }
            });

          }
        });

      }
    });
  },

  deleteInvite: function(req, res) {
    var inviteKey = req.param('id');

    Invite.findOne(inviteKey).exec(function(e, ikey) {
      if(e || !ikey) {
        return res.send('Invalid invite key.');
      }

      if(ikey.invitedTo != req.session.userinfo.company.id) {
        return res.send('Invite doesn\'t belong to this company.');
      }

      Invite.destroy({ id: inviteKey }).exec(function(e) {
        if(e) {
          return res.send('Error deleting invite key.');
        }

        res.redirect('/admin/employees');
      });
    });
  },

  employee: function(req, res) {
    var userId = req.param('id');

    if(!userId) {
      return res.serverError(new Error('AdminEmployeeNotSpecifiedException'));
    }

    PopUser.one(userId, function(e, employee) {
      if(e || !employee) {
        return res.serverError(new Error('AdminEmployeeNotFoundException'));
      }

      // same company?
      if(employee.company.id != req.session.userinfo.company.id) {
        return res.serverError(new Error('AdminEmployeeCompanyMismatchException'));
      }

      // okay
      res.view('admin/employee/edit', {
        selectedPage: 'admin',
        employee: employee,
        selectedSection: 'basic',
        breadcrumbs: [
          { name: 'Employees', href: '/admin/employees' },
          { name: employee.fullName() }
        ],
      });
    });
  },

  roles: function(req, res) {
    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'roles',
      breadcrumbs: [ { name: 'Roles' } ]
    });
  },

  getRoles: function(req, res) {
    if(req.method == 'GET') {
      // Get all the roles for the company
      Permission.find({ companyId: req.session.userinfo.company.id }, function(e, roles) {
        // Count the employees asynchonously
        async.each(roles, function(role, done) {
          User.find({ permissionId: role.id }, function(e, usrs) {
            role.employeeCount = usrs.length;
            done(); // go to next permission/role
          });
        }, function() {
          // Send to view
          res.json({"data": roles});
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected GET.'});
    }
  },

  newRole: function(req, res) {
    if(req.method == 'POST') {
      // Create a new role
      Permission.create({
        companyId: req.session.userinfo.company.id,
        jobTitle: req.param('roleName'),
        companyAdmin: false
      }).exec(function(err, newRole) {
        res.json({"success": true, "role": newRole})
      });
    } else {
      return res.json({'error':'Invalid request type. Expected POST.'});
    }
  },

  role: function(req, res) {
    var roleId = req.param('id');

    if(!roleId) {
      return res.serverError(new Error('AdminRoleNotSpecifiedException'));
    }

    Permission.findOne(roleId).exec(function(e, role){
      if(e || !role) {
        return res.serverError(new Error('AdminRoleNotFoundException'));
      }

      // same company?
      if(role.companyId != req.session.userinfo.company.id) {
        return res.serverError(new Error('AdminRoleCompanyMismatchException'));
      }

      var validSections = ['info', 'employees'];
      var selectedSection = req.param('section') || 'info';

      if(validSections.indexOf(selectedSection) == -1) {
        return res.serverError(new Error('AdminRoleInvalidSectionException'));
      }

      if(selectedSection == 'info') {
        res.view('admin/role/index', {
          selectedPage: 'admin',
          selectedSection: 'info',
          breadcrumbs: [
              { name: 'Roles', href: '/admin/roles' },
              { name: role.jobTitle }
            ],
          role: role
        });
      } else if(selectedSection == 'employees') {
        UserSpecial.many({company: req.session.userinfo.company.id, permissionId: roleId}, {sort: 'lastName ASC'}, function(employees) {
          res.view('admin/role/index', {
            selectedPage: 'admin',
            selectedSection: 'employees',
            breadcrumbs: [
              { name: 'Roles', href: '/admin/roles' },
              { name: role.jobTitle }
            ],
            role: role,
            employees: employees
          });
        });
      }
    });
  },

  offices: function(req, res) {
    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'offices',
      breadcrumbs: [ { name: 'Offices & Positions' } ]
    });
  },

  getOffices: function(req, res) {
    if(req.method == 'GET') {
      // Get all the offices for the company
      Office.find({ company: req.session.userinfo.company.id }, function(e, offices) {
        // Count the positions at each office asynchonously
        async.each(offices, function(office, done) {
          office.positionCount = 0;
          done();
        }, function() {
          // Send to view
          res.json({"data": offices});
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected GET.'});
    }
  },

  newOffice: function(req, res) {
    if(req.isSocket && req.method == 'POST') {
      Office.find({ name: req.param('officeName'), company: req.session.userinfo.company.id }, function(e, offices) {
        if(offices.length == 0) {
          // Create a new role
          Office.create({
            company: req.session.userinfo.company.id,
            name: req.param('officeName')
          }).exec(function(err, newOffice) {
            res.json({"success": true, "office": newOffice})
          });
        } else {
          res.json({'error': 'You already have an office with the same name. Pick another.'});
        }
      });
    } else {
      return res.json({'error':'Invalid request type. Expected POST via socket.'});
    }
  },

  office: function(req, res) {
    var officeId = req.param('id');

    if(!officeId) {
      return res.serverError(new Error('AdminOfficeNotSpecifiedException'));
    }

    Office.findOne(officeId).exec(function(e, office){
      if(e || !office) {
        return res.serverError(new Error('AdminOfficeNotFoundException'));
      }

      // same company?
      if(office.company != req.session.userinfo.company.id) {
        return res.serverError(new Error('AdminOfficeCompanyMismatchException'));
      }

      var validSections = ['positions'];
      var selectedSection = req.param('section') || 'positions';

      if(validSections.indexOf(selectedSection) == -1) {
        return res.serverError(new Error('AdminOfficeInvalidSectionException'));
      }

      if(selectedSection == 'positions') {
        Position.find({ office: office.id }, function(e, positions) {
          res.view('admin/office/index', {
            selectedPage: 'admin',
            selectedSection: 'positions',
            breadcrumbs: [
              { name: 'Offices & Positions', href: '/admin/offices' },
              { name: office.name }
            ],
            office: office,
            positions: positions
          });
        });
      }
    });
  },

  deleteOffice: function(req, res) {
    if(req.method == 'POST') {
      var officeId = req.param('officeId');

      if(!officeId) {
        return res.serverError(new Error('InvalidParameterException'));
      }

      Office.findOne(officeId).exec(function(e, office){
        if(e || !office) {
          return res.serverError(new Error('ParameterNotFoundInDatabaseException'));
        }

        // same company?
        if(office.company != req.session.userinfo.company.id) {
          return res.serverError(new Error('ParameterCompanyMismatchException'));
        }

        // Destroy positions associated with office
        Position.destroy({ office: office.id }, function(e) {
          if(e) {
            return res.json({'error': 'Error deleting positions associated with office.'});
          }

          // Destroy office
          Office.destroy({ id: office.id }, function(e) {
            if(e) {
              res.json({'error': 'Something went wrong. Try again.'});
            } else {
              res.json({'success': true});
            }
          });
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected POST.'});
    }
  },

  getOfficePositions: function(req, res) {
    if(req.method == 'GET') {
      var officeId = req.param('officeId');

      if(!officeId) {
        return res.serverError(new Error('AdminOfficePositionsNotSpecifiedException'));
      }

      Office.findOne(officeId).exec(function(e, office){
        if(e || !office) {
          return res.serverError(new Error('AdminOfficePositionsNotFoundException'));
        }

        // same company?
        if(office.company != req.session.userinfo.company.id) {
          return res.serverError(new Error('AdminOfficePositionsCompanyMismatchException'));
        }

        // Get all the positions for the company's location
        Position.find({ office: officeId }, function(e, positions) {
          positions.forEach(function(_position) {
            _position.delete = _position.id;
          });
          res.json({"data": positions});
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected GET.'});
    }
  },

  newOfficePosition: function(req, res) {
    if(req.isSocket && req.method == 'POST') {
      Office.findOne({ id: req.param('officeId') }, function(e, office) {
        if(e || !office) {
          return res.json({'error': 'Something went wrong.'});
        }
        if(office.company != req.session.userinfo.company.id) {
          return res.json({'error': 'This office does not belong to your company. Hmm..'});
        }
        Position.find({ office: office.id, name: req.param('positionName') }, function(e, positions) {
          if(positions.length > 0) {
            return res.json({'error': 'This location already contains a position with that name. Pick another.'});
          }

          // Create a new position at this office
          Position.create({
            office: office.id,
            company: req.session.userinfo.company.id,
            name: req.param('positionName')
          }).exec(function(err, newPosition) {
            res.json({"success": true, "position": newPosition})
          });
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected POST via socket.'});
    }
  },

  deleteOfficePosition: function(req, res) {
    if(req.isSocket && req.method == 'POST') {
      Position.findOne({ id: req.param('positionId') }, function(e, position) {
        if(e || !position) {
          return res.json({'error': 'The position does not exist.'});
        }
        if(position.company != req.session.userinfo.company.id) {
          return res.json({'error': 'This position belongs to another company. Hmm..'});
        }

        Position.destroy({ id: req.param('positionId')}, function(e) {
          if(e) {
            res.json({"error": 'An unknown error has occurred. Try again.'});
          } else {
            res.json({"success": true});
          }
        });
      });
    } else {
      return res.json({'error':'Invalid request type. Expected POST via socket.'});
    }
  }
};
