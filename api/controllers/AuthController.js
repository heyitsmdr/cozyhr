var bcrypt = require('bcrypt');

module.exports = {

  /**
   * @via     HTTP
   * @method  GET
   */
  signin: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    // check if already signed in
    if(req.session.authenticated) {
      return res.redirect('/dash');
    }

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.dev') > -1) {
      fromHost = fromHost.replace('.dev', '');
    }

    Company.findOne({ host: fromHost }).exec(es.wrap(function(e, company) {
      if(e || !company) {
        res.view({ htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin failed", errorMessage: "No company exists under this domain." });
      } else {
        res.view({ companyInfo: company, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
      }
    }));
  },

  /**
   * @via     Socket
   * @method  GET
   */
  session: function(req, res) {
    ExceptionService.require(req, res, { socket: true, GET: true });

    res.json( req.session );
  },

  /**
   * @via     HTTP
   * @method  POST
   */
  attemptLogin: function(req, res) {
    var es = ExceptionService.require(req, res, { POST: true });

    if(!req.param('email') || !req.param('password')) {
      throw ExceptionService.error('Invalid parameters.', { fatal: false });
    }

    var action = req.param('btnLogin') || req.param('btnRegister');
    switch(action) {
      case 'Register':
        User.findOneByEmail(req.param('email').toLowerCase()).exec(function(err, user){
          if(!user) {
            // Create the user
            User.create({
              firstName: req.param('firstname'),
              lastName: req.param('lastname'),
              email: req.param('email'),
              password: req.param('password')
            }).exec(function(err, user) {
              // Create the company
              Company.create({
                name: 'Green Leaf, Inc'
              }).exec(function(err, company){
                // Save the company id to the user
                user.companyId = company.id;
                user.save(function(err){
                  // Add an entry to the newsfeed
                  CompanyFeed.create({
                    companyId: company.id,
                    userId: user.id,
                    content: 'created a new human resources portal for <strong>' + company.name + '</strong>!'
                  }).exec(function(err, feed){
                    res.redirect('/auth/signin');
                  });
                });
              });
            });
          } else {
            res.send('A user already exists with that email');
          }
        });
        break;
      default:
        PopUser.one({ email: req.param('email') }, es.wrap(function(e, user) {
          if(e || !user) {
            MetricService.increment('signin.failed');
            return res.json({error: 'The email address has not been found.'});
          } else {
            bcrypt.compare(req.param('password'), user.password, es.wrap(function (err, match) {
              if(!match) {
                MetricService.increment('signin.failed');
                return res.json({error: 'The password for this account is not correct.<br><br><a href="/auth/recover">Did you forget your password?</a>'});
              } else {
                // check host
                if(user.company.host != req.host.toLowerCase().replace('.dev', '')) {
                  MetricService.increment('signin.failed');
                  return res.json({error: 'The email address does not belong to this company.'});
                }
                // all good! open the gates |==> <==|
                MetricService.increment('signin.success');
                req.session.userinfo = user;
                req.session.userinfo.fullName = user.fullName();
                req.session.authenticated = true;
                req.session.globalAdmin = user.admin || false;
                res.json({success: true});
              }
            }));
          }
        }));
        break;
    }
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  register: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.dev') > -1) {
      fromHost = fromHost.replace('.dev', '');
    }

    if(fromHost !== 'new.cozyhr.com') {
      return res.view("auth/signin", { htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin failed", errorMessage: "You cannot register a new company from here." });
    }

    res.view({ htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  orgRegistration: function(req, res) {
    var es = ExceptionService.require(req, res, { GET: true });

    // check if already signed in
    if(req.session.authenticated) {
      return res.redirect('/dash');
    }

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.dev') > -1) {
      fromHost = fromHost.replace('.dev', '');
    }

    var inviteKey = req.param('key');

    if(!inviteKey){
      return res.send('No invite key specified.');
    }

    Invite.findOne(inviteKey).populate('invitedTo').exec(es.wrap(function(e, invite) {
      if(e || !invite) {
        return res.send('Invalid invite key.');
      }

      if(fromHost != invite.invitedTo.host) {
        return res.send('Invite key not valid for this company.');
      }

      res.view({ companyInfo: invite.invitedTo, email: invite.inviteEmail, inviteKey: invite.id, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
    }));
  },

  /**
   * @via     HTTP
   * @method  POST
   */
  createUser: function(req, res) {
    var es = ExceptionService.require(req, res, { POST: true });

    var inviteKey = req.param('key');
    var firstName = req.param('fn');
    var lastName = req.param('ln');
    var password = req.param('password');

    if(!inviteKey){
      return res.json({ error: 'No invite key specified.' });
    }

    Invite.findOne(inviteKey).populate('invitedTo').exec(es.wrap(function(e, invite) {
      if(e || !invite) {
        return res.json({ error: 'Invalid invite key.' });
      }

      User.create({
        firstName: firstName,
        lastName: lastName,
        email: invite.inviteEmail,
        password: password,
        company: invite.invitedTo.id,
        role: invite.invitedRole,
        picture: MiscService.generateGravatarURL(invite.inviteEmail)
      }).exec(es.wrap(function(e, newUser) {
        if(e || !newUser) {
          return res.json({ error: 'Failed to create a new user.' });
        }

        Invite.destroy({ id: invite.id }, es.wrap(function(err) {
          res.json({ success: true });
        }));
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  POST
   */
  createCompany: function(req, res) {
    var es = ExceptionService.require(req, res, { POST: true });

    var params = ValidationService.validateParams(req, [
      { param: 'companyName', checks: [ValidationService.NOT_EMPTY] },
      { param: 'email', checks: [ValidationService.NOT_EMPTY, ValidationService.IS_EMAIL] },
      { param: 'subdomain', checks: [ValidationService.NOT_EMPTY] },
      { param: 'nameFirst', checks: [ValidationService.NOT_EMPTY] },
      { param: 'nameLast', checks: [ValidationService.NOT_EMPTY] },
      { param: 'password', checks: [ValidationService.NOT_EMPTY] }
    ]);

    if(params.hasErrors()) {
      throw ExceptionService.error('Server-side validation failed.');
    }

    Company.find({ host: params.get('subdomain').toLowerCase() + '.cozyhr.com' }).exec(es.wrap(function(e, companies) {
      if(e || companies.length >= 1) {
        return res.json({ success: false, error: 'The subdomain you\'ve choosen is already in use. Please choose a new one.' });
      }

      User.findOne({ email: params.get('email').toLowerCase() }).exec(es.wrap(function(e, users) {
        if(e) {
          throw ExceptionService.error('Error looking for users matching email.');
        }

        if(users) {
          return res.json({ success: false, error: 'The email is already associated with another CozyHR user. Please use another email.' });
        }

        Company.create({ name: params.get('companyName'), host: params.get('subdomain').toLowerCase() + '.cozyhr.com' }).exec(es.wrap(function(e, createdCompany) {
          if(e) {
            throw ExceptionService.error('Could not create company.');
          }

          Role.create({ companyId: createdCompany.id, jobTitle: 'Founder / CEO', companyAdmin: true }).exec(es.wrap(function(e, createdRole) {
            if(e) {
              throw ExceptionService.error('Could not create role.');
            }

            User.create({
              firstName: params.get('nameFirst'),
              lastName: params.get('nameLast'),
              email: params.get('email'),
              password: params.get('password'),
              company: createdCompany.id,
              role: createdRole.id,
              picture: MiscService.generateGravatarURL(params.get('email'))
            }).exec(es.wrap(function(e, createdUser) {
              if(e) {
                throw ExceptionService.error('Could not create user.');
              }

              CompanyFeed.create({ company: createdCompany.id, user: createdUser.id, office: null, content: 'created a new human resources portal for ' + createdCompany.name + '!'}).exec(es.wrap(function(e, createdFeed) {
                if(e) {
                  throw ExceptionService.error('Could not create feed item.');
                }

                res.json({ success: true, subdomain: createdCompany.host });
              }));
            }));
          }));
        }));
      }));
    }));
  },

  /**
   * @via     HTTP
   * @method  GET
   */
  signout: function(req, res) {
    ExceptionService.require(req, res, { GET: true });

    req.session.authenticated = false;
    req.session.userinfo = undefined;
    res.redirect('/auth/signin');
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AuthController)
   */
  _config: {}


};
