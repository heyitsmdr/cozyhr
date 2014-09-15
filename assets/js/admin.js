var _admin = CozyHR.pageHelpers.admin = function() { };

_admin.prototype.init = function() {
  return this;
};

_admin.prototype.initRoles = function() {
  $(document).ready(function(){
    // Init the data table
    $('#companyRoles').dataTable({
      "pageLength": 50,
      "ajax": {
        "url": "/admin/getRoles",
        "type": "GET"
      },
      "columns": [
        { "data": "jobTitle", "render": function(d,t,r,m) { return "<a href='/admin/role/" + r.id + "'>"+d+"</a>"; } },
        { "data": "employeeCount" }
      ]
    });

    // Init events
    $('#btnCreateRole').on('click', _.debounce(function(){
      if( $('#txtNewRole').val().length > 0) {
        io.socket.post('/admin/newRole', {
          roleName: $('#txtNewRole').val()
        }, function(res) {
          if(res.success) {
            $('#txtNewRole').val('');
            $('#companyRoles').DataTable().ajax.reload();
            CozyHR.notify('Your new role has been created.', {color: 'green', sound: true});
          } else {
            alert(res.error);
          }
        });
      }
    }, 500, true));
  }.bind(this));
};

_admin.prototype.initEmployees = function() {
  $(document).ready(function(){
    // Set up the table
    $('#companyEmployees').dataTable({
      "pageLength": 50,
      "oLanguage": {
        "sEmptyTable": "There are no employees to display here."
      }
    });
    // Bind click event to invite a new employee
    if($('#selNewEmployeeRole')) {
      $('#selNewEmployeeRole').chosen({width:'200px'});
    }

    $('#btnInviteEmployee').on('click', function() {
      if($('#txtNewEmployeeEmail').val().length > 0) {
        io.socket.post('/admin/do_invite', {
          email: $('#txtNewEmployeeEmail').val(),
          role: $('#selNewEmployeeRole').val()
        }, function(res) {
          if(res.success)
            document.location = "/admin/employees";
          else
            alert(res.error);
        });
      }
    });
  }.bind(this));
};

_admin.prototype.initOffices = function() {
  $(document).ready(function(){
    // Init the data table
    $('#companyOffices').dataTable({
      "pageLength": 50,
      "oLanguage": {
        "sEmptyTable": "No offices have been constructed (created) yet."
      },
      "ajax": {
        "url": "/admin/getOffices",
        "type": "GET"
      },
      "columns": [
        { "data": "name", "render": function(d,t,r,m) { return "<a href='/admin/office/" + r.id + "'>"+d+"</a>"; } },
        { "data": "positionCount" }
      ]
    });

    // Bind click
    $('#btnConstructOffice').on('click', _.debounce(function(){
      if( $('#txtNewOffice').val().length > 0) {
        io.socket.post('/admin/newOffice', {
          officeName: $('#txtNewOffice').val()
        }, function(res) {
          if(res.success) {
            $('#txtNewOffice').val('');
            $('#companyOffices').DataTable().ajax.reload();
            CozyHR.notify('Your new office has been constructed.', {color: 'green', sound: true});
          } else {
            alert(res.error);
          }
        });
      }
    }, 500, true));
  }.bind(this));
};