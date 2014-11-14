/**
 * CompanyFeed
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	company: { model: 'Company' },
  	user: { model: 'User' },
    office: { model: 'Office' },
  	content: 'string'
  }

};
