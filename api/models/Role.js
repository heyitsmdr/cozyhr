/**
 * Permission
 *
 * Description: Each job title (role) is assigned a permission to determine
 * what they can or cannot do.
 *
 */

// TODO: Convert companyId into a company model

module.exports = {

  attributes: {

    companyId: 'string',
    jobTitle: 'string',
    companyAdmin: 'boolean'

  }

};
