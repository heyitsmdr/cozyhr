var bcrypt = require('bcrypt');

/**
 * AuthController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
    
  signin: function(req, res) {
  	res.view({
  		companyName: 'Leaf, Inc',
      authenticated: req.session.authenticated
  	});
  },

  do_signin: function(req, res) {
  	if(!req.param('email') || !req.param('password')) {
  		res.send('bad');
  		return;
  	}

    var action = req.param('btnLogin') || req.param('btnRegister');
    switch(action) {
      case 'Register':
        User.findOneByEmail(req.param('email').toLowerCase()).done(function(err, user){
          if(!user) {
            // Create the user
            User.create({
              firstName: 'Joe',
              lastName: 'Smith',
              email: req.param('email'),
              password: req.param('password')
            }).done(function(err, user) {
              // Create the company
              Company.create({
                name: 'Green Leaf, Inc'
              }).done(function(err, company){
                // Save the company id to the user
                user.companyId = company.id;
                user.save(function(err){
                  // Add an entry to the newsfeed
                  CompanyFeed.create({
                    companyId: company.id,
                    userId: user.id,
                    content: 'created a new human resources portal for <strong>' + company.name + '</strong>!'
                  }).done(function(err, feed){
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
        User.findOneByEmail(req.param('email')).done(function(err, user){
          if(user) {
            bcrypt.compare(req.param('password'), user.password, function (err, match) {
              if(match) {
                req.session.userinfo = user;
                req.session.userinfo.fullName = user.fullName();
                req.session.authenticated = true;
                res.redirect('/main/home');
              } else {
                res.send('incorrect password');
              }
            });
          } else {
            res.send('email not found');
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
  	}).done(function(err, user) {
  		res.send('user created');
  	});
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AuthController)
   */
  _config: {}

  
};
