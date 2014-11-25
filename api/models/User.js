var bcrypt = require('bcrypt');

/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		firstName: {
			type: 'string',
			maxLength: 20,
			minLength: 2
		},
		lastName: {
			type: 'string',
			maxLength: 30,
			minLength: 2
		},
		fullName: function() {
			return this.firstName + ' ' + this.lastName;
		},
		email: 'string',
		password: 'string',
    company: { model: 'Company' },
    role: { model: 'Role' },
    counter_pto: {
      type: 'float',
      defaultsTo: 0
    },
    counter_sick: {
      type: 'float',
      defaultsTo: 0
    },
    counter_vaca: {
      type: 'float',
      defaultsTo: 0
    },
    picture: 'string'
	},

	/* Lifecycle Callbacks */
	beforeCreate: function (attrs, next) {
		bcrypt.genSalt(10, function(err, salt) {
		  if (err) return next(err);

		  bcrypt.hash(attrs.password, salt, function(err, hash) {
		    if (err) return next(err);

		    attrs.password = hash;
		    next();
		  });
		});
	}

};
