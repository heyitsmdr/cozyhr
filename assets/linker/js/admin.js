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
      // Init the data table
      $('#companyRoles').dataTable({
        "pageLength": 50
      });
      // Init events
      $('#btnCreateRole').on('click', function(){
        if( $('#txtNewRole').val().length > 0) {
          socket.post('/admin/do_create_role', {
            roleName: $('#txtNewRole').val()
          }, function(res) {

          });
        }
      });
    }
  }.bind(ADMIN_UTILS.instance));
};