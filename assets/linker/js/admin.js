var ADMIN_UTILS = function() { ADMIN_UTILS.instance = this; };

ADMIN_UTILS.instance = null;

ADMIN_UTILS.prototype.init = function() {
  $(document).ready(function(){
    // Employees page?
    if( $('#companyEmployees').length > 0 ) {
      $('#companyEmployees').dataTable({
        "pageLength": 50
      });
    } else if ( $('#companyRoles').length > 0 ) {
      $('#companyRoles').dataTable({
        "pageLength": 50
      });
    }
  }.bind(ADMIN_UTILS.instance));
};