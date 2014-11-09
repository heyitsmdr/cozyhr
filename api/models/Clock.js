/**
* Clock.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    clockout: 'datetime',
    user: { model: 'User' },
    company: { model: 'Company' },
    position: { model: 'Position' },
    working: 'boolean'
  }
};