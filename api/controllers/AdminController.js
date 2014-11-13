module.exports = {
  /**
   * @via     HTTP
   * @method  GET
   */
  general: function(req, res) {
    ExceptionService.require(req, res, { GET: true });

    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'general',
      breadcrumbs: [ { name: 'General' } ]
    });
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  employees: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    PopUser.many({company: req.session.userinfo.company.id}, {sort: 'lastName ASC'}, es.wrap(function (e, employees) {
      if(e)
        throw ExceptionService.error('Could not find user.');

      Role.find({ companyId: req.session.userinfo.company.id }).exec(es.wrap(function(e, roles) {
        if(e)
          throw ExceptionService.error('Could not get roles for company.');

        Invite.find({ invitedTo: req.session.userinfo.company.id }).populate('invitedRole').exec(es.wrap(function(e, invites) {
          if(e)
            throw ExceptionService.error('Could not find invites for company.');

          res.view('admin/index', {
            selectedPage: 'admin',
            selectedSection: 'employees',
            breadcrumbs: [ { name: 'Employees' } ],
            employees: employees,
            allRoles: roles,
            allInvites: invites
          });
        }));
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  createInvite: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var invitedEmail = req.param('email');
    var invitedRole = req.param('role');

    if(invitedEmail.indexOf('@') == -1 || invitedEmail.indexOf('@') == -1) {
      throw ExceptionService.error('Invalid email format.', { fatal: false });
    }

    Invite.findOne({ inviteEmail: invitedEmail.toLowerCase() }).exec(es.wrap(function(e, invites) {
      if(e || invites)
        throw ExceptionService.error('Email was already invited.', { fatal: false });

      User.findOne({ email: invitedEmail }).exec(es.wrap(function(e, users) {
        if(e || users)
          throw ExceptionService.error('Email already exists in our database.', { fatal: false });

        Role.findOne(invitedRole).exec(es.wrap(function(e, role) {
          if(e || !role) {
            throw ExceptionService.error('Role does not exist.');
          } else if(role.companyId != req.session.userinfo.company.id) {
            throw ExceptionService.error('Role does not belong to this company.');
          } else {
            Invite.create({
              inviteEmail: invitedEmail.toLowerCase(),
              invitedBy: req.session.userinfo.id,
              invitedTo: req.session.userinfo.company.id,
              invitedRole: invitedRole
            }).exec(es.wrap(function(e, inviteKey) {
              if(e) {
                throw ExceptionService.error('Error creating invite.');
              }

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
            }));
          }
        }));
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  deleteInvite: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var inviteKey = req.param('id');

    Invite.findOne(inviteKey).exec(es.wrap(function(e, ikey) {
      if(e || !ikey) {
        throw ExceptionService.error('Invalid invite key.');
      }

      if(ikey.invitedTo != req.session.userinfo.company.id) {
        throw ExceptionService.error('Invite key does not belong to this company.');
      }

      Invite.destroy({ id: inviteKey }).exec(es.wrap(function(e) {
        if(e) {
          throw ExceptionService.error('Error deleting invite key.');
        }

        res.redirect('/admin/employees');
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   * @note    You don't need admin privs to see /admin/employee! Keep this in mind.
   */
  employee: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: false, GET: true });

    var userId = req.param('id');

    if(!userId) {
      throw ExceptionService.error('No employee id specified.');
    }

    PopUser.one(userId, es.wrap(function(e, employee) {
      if(e || !employee) {
        throw ExceptionService.error('Employee not found.');
      }

      // same company?
      if(employee.company.id != req.session.userinfo.company.id) {
        throw ExceptionService.error('Employee is not from this company.');
      }

      // is this you? if not, need admin
      if(employee.id !== req.session.userinfo.id && !req.session.userinfo.role.companyAdmin) {
        throw ExceptionService.error('You are not permitted to perform this action.');
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
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  saveEmployee: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var userId = req.param('userId');

    User.findOne(userId).exec(es.wrap(function(e, user) {
      if(e || !user) {
        throw ExceptionService.error('User not found.');
      }

      // is it you? if not, are you admin?
      if(user.id !== req.session.userinfo.id && !req.session.userinfo.role.companyAdmin) {
        throw ExceptionService.error('Not permitted to edit this user.');
      }

      // alright, let us continue
      var fullName = req.param('fullName');
      var picture = req.param('picture');

      User.update({ id: user.id }, {
        picture: picture
      }).exec(es.wrap(function(e, updatedUser) {
        if(e) {
          throw ExceptionService.error('Could not update user.');
        }

        req.session.userinfo.picture = updatedUser[0].picture;
        res.json({ success: true });
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  saveGeneral: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var companyName = req.param('companyName');

    throw ExceptionService.error('Not permitted to make changes to this company.');

    if(!req.session.userinfo.role.companyAdmin) {
      throw ExceptionService.error('Not permitted to make changes to this company.');
    }

    Company
      .update({ id: req.session.userinfo.company.id }, { name: companyName })
      .exec(es.wrap(function(e, updatedCompany) {
        if(e) {
          throw ExceptionService.error('Could not update company.');
        }

        req.session.userinfo.company.name = companyName;
        res.json({ success: true });
      }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  saveNewSubdomain: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var subdomain = req.param('subdomain');

    if(!req.session.userinfo.role.companyAdmin) {
      throw ExceptionService.error('Not permitted to make changes to this company.');
    }

    Company
      .find({ host: subdomain.toLowerCase() + '.cozyhr.com' })
      .exec(es.wrap(function(e, foundCompanies) {
        if(e || foundCompanies.length > 0) {
          throw ExceptionService.error('Another company is already using that subdomain. Pick a new one.', {fatal: false});
        }

        Company
          .update({ id: req.session.userinfo.company.id }, { host: subdomain.toLowerCase() + '.cozyhr.com' })
          .exec(es.wrap(function(e, updatedCompany) {
            if(e) {
              throw ExceptionService.error('Could not update company.');
            }

            req.session.userinfo.company.host = subdomain;
            res.json({ success: true });
          }));
      }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  roles: function(req, res) {
    ExceptionService.require(req, res, { GET: true });

    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'roles',
      breadcrumbs: [ { name: 'Roles' } ]
    });
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  getRoles: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    // Get all the roles for the company
    Role.find({ companyId: req.session.userinfo.company.id }).exec(es.wrap(function(e, roles) {
      if(e)
        throw ExceptionService.error('Could not get roles within company.');

      // Count the employees asynchonously
      async.each(roles, es.wrap(function(role, done) {
        User.find({ role: role.id }).exec(es.wrap(function(e, usrs) {
          if(e)
            throw ExceptionService.error('Error counting users for role.');
          role.employeeCount = usrs.length;
          done(); // go to next permission/role
        }));
      }), es.wrap(function() {
        // Send to view
        res.json({"data": roles});
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  newRole: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Role.find({ jobTitle: req.param('roleName') }).exec(es.wrap(function(e, roles) {
      if(e)
        throw ExceptionService.error('Error checking roles.');

      if(roles.length > 0) {
        throw ExceptionService.error('You already have a role with the same name.', { fatal: false });
      } else {
        // Create a new role
        Role.create({
          companyId: req.session.userinfo.company.id,
          jobTitle: req.param('roleName'),
          companyAdmin: false
        }).exec(es.wrap(function(err, newRole) {
          res.json({"success": true, "role": newRole})
        }));
      }
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  role: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var roleId = req.param('id');

    if(!roleId) {
      throw ExceptionService.error('No role id specified.');
    }

    Role.findOne(roleId).exec(es.wrap(function(e, role){
      if(e || !role) {
        throw ExceptionService.error('Role not found.');
      }

      // same company?
      if(role.companyId != req.session.userinfo.company.id) {
        throw ExceptionService.error('Role does not belong to this company.');
      }

      var validSections = ['info', 'employees'];
      var selectedSection = req.param('section') || 'info';

      if(validSections.indexOf(selectedSection) == -1) {
        throw ExceptionService.error('Invalid section identifier.');
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
        PopUser.many({company: req.session.userinfo.company.id, role: roleId}, {sort: 'lastName ASC'}, es.wrap(function(e, employees) {
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
        }));
      }
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  deleteRole: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var roleId = req.param('roleId');

    if(!roleId) {
      throw ExceptionService.error('No role id specified.');
    }

    Role.findOne(roleId).exec(es.wrap(function(e, role) {
      if(e || !role) {
        throw ExceptionService.error('Could not find role.');
      }

      // same company?
      if(role.companyId != req.session.userinfo.company.id) {
        throw ExceptionService.error('Role does not belong to this company.');
      }

      // TODO: Check if any users are assigned to this role

      Role.destroy({ id: role.id }).exec(es.wrap(function(e) {
        if(e) {
          throw ExceptionService.error('Error deleting role.');
        }

        res.json({ success: true });
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  offices: function(req, res) {
    ExceptionService.require(req, res, { GET: true });

    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'offices',
      breadcrumbs: [ { name: 'Offices & Positions' } ]
    });
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  getOffices: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    // Get all the offices for the company
    Office.find({ company: req.session.userinfo.company.id }).exec(es.wrap(function(e, offices) {
      if(e)
        throw ExceptionService.error('Could not find office.');

      // Count the positions at each office asynchonously
      async.each(offices, es.wrap(function(office, done) {
        Position.find({ office: office.id }).exec(es.wrap(function(e, positions) {
          if(e)
            throw ExceptionService.error('Could not get positions at office.');
          office.positionCount = positions.length;
          done();
        }));
      }), es.wrap(function() {
        // Send to view
        res.json({"data": offices});
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  newOffice: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Office.find({ name: req.param('officeName'), company: req.session.userinfo.company.id }).exec(es.wrap(function(e, offices) {
      if(e)
        throw ExceptionService.error('Error checking for offices.');

      if(offices.length == 0) {
        // Create a new role
        Office.create({
          company: req.session.userinfo.company.id,
          name: req.param('officeName')
        }).exec(es.wrap(function(err, newOffice) {
          if(err)
            throw ExceptionService.error('Could not create new office.');

          res.json({"success": true, "office": newOffice})
        }));
      } else {
        throw ExceptionService.error('You already have an office with the same name.', { fatal: false });
      }
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  office: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var officeId = req.param('id');

    if(!officeId) {
      throw ExceptionService.error('No office id specified.');
    }

    Office.findOne(officeId).exec(es.wrap(function(e, office){
      if(e || !office) {
        throw ExceptionService.error('Office not found.');
      }

      // same company?
      if(office.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Office does not belong to this company.');
      }

      var validSections = ['positions'];
      var selectedSection = req.param('section') || 'positions';

      if(validSections.indexOf(selectedSection) == -1) {
        throw ExceptionService.error('Invalid section identifier.');
      }

      if(selectedSection == 'positions') {
        Position.find({ office: office.id }).exec(es.wrap(function(e, positions) {
          if(e)
            throw ExceptionService.error('Could not get positions at office.');

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
        }));
      }
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  deleteOffice: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    var officeId = req.param('officeId');

    if(!officeId) {
      throw ExceptionService.error('No office id specified.');
    }

    Office.findOne(officeId).exec(es.wrap(function(e, office){
      if(e || !office) {
        throw ExceptionService.error('Could not find office.');
      }

      // same company?
      if(office.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Office does not belong to this company.');
      }

      // Destroy positions associated with office
      Position.destroy({ office: office.id }, es.wrap(function(e) {
        if(e) {
          return res.json({'error': 'Error deleting positions associated with office.'});
        }

        // Destroy office
        Office.destroy({ id: office.id }, function(e) {
          if(e) {
            throw ExceptionService.error('Error deleting office.');
          }

          res.json({'success': true});
        });
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  getOfficePositions: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var officeId = req.param('officeId');

    if(!officeId) {
      throw ExceptionService.error('No office id specified.');
    }

    Office.findOne(officeId).exec(es.wrap(function(e, office){
      if(e || !office) {
        throw ExceptionService.error('Office not found.');
      }

      // same company?
      if(office.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Office does not belong to this company.');
      }

      // Get all the positions for the company's location
      Position.find({ office: officeId }).exec(es.wrap(function(e, positions) {
        positions.forEach(function(_position) {
          _position.delete = _position.id;
        });
        res.json({"data": positions});
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  newOfficePosition: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Office.findOne({ id: req.param('officeId') }).exec(es.wrap(function(e, office) {
      if(e || !office) {
        throw ExceptionService.error('Office not found.');
      }
      if(office.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Office does not belong to this company.');
      }
      Position.find({ office: office.id, name: req.param('positionName') }).exec(es.wrap(function(e, positions) {
        if(positions.length > 0) {
          throw ExceptionService.error('You already have a position with the same name.', { fatal: false });
        }

        // Create a new position at this office
        Position.create({
          office: office.id,
          company: req.session.userinfo.company.id,
          name: req.param('positionName')
        }).exec(es.wrap(function(err, newPosition) {
          if(err)
            throw ExceptionService.error('Error creating new position.');

          res.json({"success": true, "position": newPosition})
        }));
      }));
    }));
  },

  /**
   * @via     Socket
   * @method  POST
   */
  deleteOfficePosition: function(req, res) {
    var es = ExceptionService.require(req, res, { socket: true, POST: true });

    Position.findOne({ id: req.param('positionId') }).exec(es.wrap(function(e, position) {
      if(e || !position) {
        throw ExceptionService.error('Position not found.');
      }
      if(position.company != req.session.userinfo.company.id) {
        throw ExceptionService.error('Position does not belong to this company.');
      }

      Position.destroy({ id: req.param('positionId')}, es.wrap(function(e) {
        if(e) {
          throw ExceptionService.error('Error deleting position.');
        } else {
          res.json({"success": true});
        }
      }));
    }));
  }
};
