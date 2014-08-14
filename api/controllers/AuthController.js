var bcrypt = require('bcrypt');

module.exports = {

  signin: function(req, res) {
    // check if already signed in
    if(req.session.authenticated) {
      return res.redirect('/dash');
    }

    var fromHost = req.host.toLowerCase();

    if(fromHost.indexOf('.local') > -1) {
      fromHost = fromHost.replace('.local', '');
    }

    Company.findOne({ host: fromHost }).exec(function(e, company) {
      if(e || !company) {
        res.view({ htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin failed" });
      } else {
        res.view({ companyInfo: company, htmlClass: "signin", noSkelJs: true, bodyClass: "signin", extraContainerClass: "signin" });
      }
    });
  },

  register: function(req, res) {
    res.view();
  },

  do_signin: function(req, res) {
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
        PopUser.one({ email: req.param('email') }, function(e,user) {
          if(e || !user) {
            return res.json({error: 'email not found'});
          } else {
            bcrypt.compare(req.param('password'), user.password, function (err, match) {
              if(!match) {
                return res.json({error: 'incorrect password'});
              } else {
                // check host
                if(user.company.host != req.host.toLowerCase() && req.host.toLowerCase().indexOf('.local') == -1) {
                  return res.json({error: 'user is not part of this company'});
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
