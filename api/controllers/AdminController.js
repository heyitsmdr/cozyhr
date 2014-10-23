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
      Role.find({ companyId: req.session.userinfo.company.id }).exec(function(e, roles) {
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

            Role.findOne(invitedRole).exec(function(e, role) {
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

  /* Note: You don't need admin privs to see /admin/employee! Keep this in mind. */
  employee: function(req, res) {
    ExceptionService.require(req, { socket: false, GET: true });

    var userId = req.param('id');

    if(!userId) {
      throw new Error('No employee id specified.');
    }

    PopUser.one(userId, function(e, employee) {
      if(!employee) {
        throw new Error('Employee not found.');
      }

      // same company?
      if(employee.company.id != req.session.userinfo.company.id) {
        throw new Error('Employee is not from this company.');
      }

      // is this you? if not, need admin
      if(employee.id !== req.session.userinfo.id && !req.session.userinfo.role.companyAdmin) {
        return res.forbidden('You are not permitted to perform this action.');
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
    }, res);
  },

  /* Request Type: Socket.POST */
  saveEmployee: function(req, res) {
    ExceptionService.require(req, { socket: true, POST: true });

    var userId = req.param('userId');

    User.findOne(userId).exec(function(e, user) {
      if(e || !user) {
        return ExceptionService.incompleteSocketRequest(res, 'User not found.');
      }

      // is it you? if not, are you admin?
      if(user.id !== req.session.userinfo.id && !req.session.userinfo.role.companyAdmin) {
        return ExceptionService.incompleteSocketRequest(res, 'Not permitted.');
      }

      // alright, let us continue
      var fullName = req.param('fullName');
      var picture = req.param('picture');

      User.update({ id: user.id }, {
        picture: picture
      }).exec(function(e, updatedUser) {
        if(e) {
          return ExceptionService.incompleteSocketRequest(res, 'Could not update record.');
        }

        req.session.userinfo.picture = updatedUser[0].picture;
        res.json({ success: true });
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
      Role.find({ companyId: req.session.userinfo.company.id }, function(e, roles) {
        // Count the employees asynchonously
        async.each(roles, function(role, done) {
          User.find({ role: role.id }).exec(function(e, usrs) {
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
      Role.create({
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

    Role.findOne(roleId).exec(function(e, role){
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
        PopUser.many({company: req.session.userinfo.company.id, role: roleId}, {sort: 'lastName ASC'}, function(e, employees) {
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

  deleteRole: function(req, res) {
    return res.json({'error':'Not implemented yet.'});
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
          Position.find({ office: office.id }, function(e, positions) {
            office.positionCount = positions.length;
            done();
          })
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
