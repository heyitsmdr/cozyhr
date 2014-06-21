/**
 * CompanyFeedComments
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		feedId: 'string',
		userId: 'string',
		content: {
      type: 'string',
      minLength: 2,
      maxLength: 1024
    }
	}

};
