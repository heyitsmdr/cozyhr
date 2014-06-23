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
		admin: {
			type: 'boolean',
			defaultsTo: false
		},
		companyId: 'string',
		permissionId: 'string',
		picture: 'string',
		generatePicture: function(smallPicture) {
			return {
					name: this.fullName(),
					picture: this.picture,
					small: smallPicture,
					position: ''
			};
		}
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
