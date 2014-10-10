var bcrypt = require('bcrypt');

module.exports = {

  signin: function(req, res) {
    // check if already signed in
    if(req.session.authenticated) {
      return res.redirect('/dash');
    }

    MetricService.writeRawMetric('blah.foo 123');

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.dev') > -1) {
      fromHost = fromHost.replace('.dev', '');
    }

    Company.findOne({ host: fromHost }).exec(function(e, company) {
      if(e || !company) {
        res.view({ htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin failed" });
      } else {
        res.view({ companyInfo: company, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
      }
    });
  },

  do_signin: function(req, res) {
    if(req.method != 'POST') {
      return res.json({ error: 'Invalid method.' });
    }

    if(!req.param('email') || !req.param('password')) {
      res.json({error: 'bad'});
      return;
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
        PopUser.one({ email: req.param('email') }, function(e, user) {
          if(e || !user) {
            return res.json({error: 'The email address has not been found.'});
          } else {
            bcrypt.compare(req.param('password'), user.password, function (err, match) {
              if(!match) {
                return res.json({error: 'The password for this account is not correct.<br><br><a href="/auth/recover">Did you forget your password?</a>'});
              } else {
                // check host
                if(user.company.host != req.host.toLowerCase() && req.host.toLowerCase().indexOf('.dev') == -1) {
                  return res.json({error: 'The email address does not belong to this company.'});
                }
                // all good! open the gates |==> <==|
                req.session.userinfo = user;
                req.session.userinfo.fullName = user.fullName();
                req.session.authenticated = true;
                req.session.globalAdmin = user.admin || false;
                res.json({success: true});
              }
            });
          }
        });
        break;
    }
  },

  register: function(req, res) {
    res.view();
  },

  orgRegistration: function(req, res) {
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

    Invite.findOne(inviteKey).populate('invitedTo').exec(function(e, invite) {
      if(e || !invite) {
        return res.send('Invalid invite key.');
      }

      if(fromHost != invite.invitedTo.host) {
        return res.send('Invite key not valid for this company.');
      }

      res.view({ companyInfo: invite.invitedTo, email: invite.inviteEmail, inviteKey: invite.id, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
    });
  },

  do_org_register: function(req, res) {
    if(req.method != 'POST') {
      return res.json({ error: 'Invalid method.' });
    }

    var inviteKey = req.param('key');
    var firstName = req.param('fn');
    var lastName = req.param('ln');
    var password = req.param('password');

    if(!inviteKey){
      return res.json({ error: 'No invite key specified.' });
    }

    Invite.findOne(inviteKey).populate('invitedTo').exec(function(e, invite) {
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
        picture: ""
      }).exec(function(e, newUser) {
        if(e || !newUser) {
          return res.json({ error: 'Failed to create a new user.' });
        }

        Invite.destroy({ id: invite.id }, function(err) {
          res.json({ success: true });
        });
      });
    });
  },

  signout: function(req, res) {
    req.session.authenticated = false;
    req.session.userinfo = undefined;
    res.redirect('/auth/signin');
  },

  dev_create_users: function(req, res) {
  	User.create({
  		firstName: 'Mike',
  		lastName: 'Du Russel',
  		email: 'ethryx@me.com',
  		password: 'bunny'
  	}).exec(function(err, user) {
  		res.send('user created');
  	});
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AuthController)
   */
  _config: {}


};
