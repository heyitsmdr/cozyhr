/**
 * APIController
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

  roles: function(req, res) {
    if(req.method == 'GET') {
      // Get all the roles for the company
      Permission.find({ companyId: req.session.userinfo.companyId }, function(e, roles) {
        // Count the employees asynchonously
        async.each(roles, function(role, done) {
          User.find({ permissionId: role.id }, function(e, usrs) {
            role.employeeCount = usrs.length;
            done(); // go to next permission/role
          });
        }, function() {
          // Send to view
          res.json({"data": roles});
        });
      });
    } else {
      res.json({
        "error": "This API method doesn't accept a " + req.method + " request."
      });
    }
  },

  role: function(req, res) {
    if(req.method == 'POST') {
      // Create a new role
      Permission.create({
        companyId: req.session.userinfo.companyId,
        jobTitle: req.param('roleName'),
        companyAdmin: false
      }).done(function(err, newRole) {
        res.json({"success": true, "role": newRole})
      });
    } else {
      res.json({
        "error": "This API method doesn't accept a " + req.method + " request."
      });
    }
  }

};
