/**
 * AdminController
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

  index: function(req, res) {
    res.view({
      selectedPage: 'admin'
    });
  },

  general: function(req, res) {
    res.view('admin/index', {
      selectedPage: 'admin',
      selectedSection: 'general'
    });
  },

  employees: function(req, res) {
    UserSpecial.many({companyId: req.session.userinfo.companyId}, {sort: 'lastName ASC'}, function(employees) {
      res.view('admin/index', {
          selectedPage: 'admin',
          selectedSection: 'employees',
          employees: employees
        });
    });
  },

  employee: function(req, res) {
    var userId = req.param('id');

    if(!userId) {
      return res.serverError(new Error('AdminEmployeeNotSpecifiedException'));
    }

    var gotEmployee = function(e, employee) {
      if(e || !employee) {
        return res.serverError(new Error('AdminEmployeeNotFoundException'));
      }

      // same company?
      if(employee.companyId != req.session.userinfo.companyId) {
        return res.serverError(new Error('AdminEmployeeCompanyMismatchException'));
      }

      // okay
      res.view('admin/employee/edit', {
        selectedPage: 'admin',
        employee: employee,
        selectedSection: 'basic'
      });
    };

    User.findOne(userId).done(gotEmployee);
  }

};
