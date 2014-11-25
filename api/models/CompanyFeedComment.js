/**
 * CompanyFeedComments
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		feed: { model: 'CompanyFeed' },
		user: { model: 'User' },
		content: {
      type: 'string',
      minLength: 2,
      maxLength: 1024
    }
	}

};
