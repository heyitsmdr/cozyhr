var ADMIN_UTILS = function() { ADMIN_UTILS.instance = this; };

ADMIN_UTILS.instance = null;

ADMIN_UTILS.prototype.init = function() {
  $(document).ready(function(){
    if( $('#companyEmployees') ) {
      $('#companyEmployees').dataTable({
        "pageLength": 50
      });
    }
  }.bind(ADMIN_UTILS.instance));
};