var _admin = CozyHR.pageHelpers.admin = function() { };

_admin.prototype.init = function() {
  return this;
};

_admin.prototype.initRoles = function() {
  $(document).ready(function() {
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
    $('#txtNewRole').txtSubmit('#btnCreateRole', _.debounce(function() {
      if( $('#txtNewRole').val().length > 0) {
        io.socket.post('/admin/newRole', {
          roleName: $('#txtNewRole').val()
        }, function(res) {
          if(res.success) {
            $('#txtNewRole').val('');
            $('#companyRoles').DataTable().ajax.reload();
            CozyHR.notify('Your new role has been created.', {color: 'green', sound: true});
          } else {
            CozyHR.notify(res.error, {color: 'red', sound: true});
          }
        });
      }
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};

_admin.prototype.initEmployees = function() {
  $(document).ready(function() {
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

    $('#btnInviteEmployee').on('click', _.debounce(function() {
      if($('#txtNewEmployeeEmail').val().length > 0) {
        io.socket.post('/admin/createInvite', {
          email: $('#txtNewEmployeeEmail').val(),
          role: $('#selNewEmployeeRole').val()
        }, function(res) {
          if(res.success)
            document.location = "/admin/employees";
          else
            CozyHR.notify(res.error, {color: 'red', sound: true});
        });
      }
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};

_admin.prototype.initOffices = function() {
  $(document).ready(function() {
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
    $('#txtNewOffice').txtSubmit('#btnConstructOffice', _.debounce(function(){
      if( $('#txtNewOffice').val().length > 0) {
        io.socket.post('/admin/newOffice', {
          officeName: $('#txtNewOffice').val()
        }, function(res) {
          if(res.success) {
            $('#txtNewOffice').val('');
            $('#companyOffices').DataTable().ajax.reload();
            CozyHR.notify('Your new office has been constructed.', {color: 'green', sound: true});
          } else {
            CozyHR.notify(res.error, {color: 'red', sound: true});
            $('#txtNewOffice').focus();
          }
        });
      }
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};

_admin.prototype.initPositions = function() {
  $(document).ready(function() {
    // Init the data table
    $('#companyOfficePositions').dataTable({
      "pageLength": 50,
      "oLanguage": {
        "sEmptyTable": "No positions for this location have been created yet."
      },
      "ajax": {
        "url": "/admin/getOfficePositions",
        "type": "GET",
        "data": { officeId: CozyHR.officeId }
      },
      "columns": [
        { "data": "name", "render": function(d,t,r,m) { return d; } },
        { "data": "delete", "render": function(d,t,r,m) { return "&nbsp;<a href='#' class='delete-position' data-id='" + d + "'><i class='fa fa-times'></i></a>"; } }
      ]
    });

    // Bind click
    $('#txtNewPosition').txtSubmit('#btnNewPosition', _.debounce(function(){
      if( $('#txtNewPosition').val().length > 0) {
        io.socket.post('/admin/newOfficePosition', {
          officeId: CozyHR.officeId,
          positionName: $('#txtNewPosition').val()
        }, function(res) {
          if(res.success) {
            $('#txtNewPosition').val('');
            $('#companyOfficePositions').DataTable().ajax.reload();
            CozyHR.notify('A new position has been created at this office.', {color: 'green', sound: true});
          } else {
            CozyHR.notify(res.error, {color: 'red', sound: true});
            $('#txtNewPosition').focus();
          }
        });
      }
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));

    // Bind delete position
    $(document).on('click', '.delete-position', _.debounce(function() {
      io.socket.post('/admin/deleteOfficePosition', {
        positionId: $(this).data('id')
      }, function(res) {
        if(res.success) {
          $('#companyOfficePositions').DataTable().ajax.reload();
        } else {
          CozyHR.notify(res.error, {color: 'red', sound: true});
        }
      });
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));

    // Bind delete office
    $('#btnDeleteOffice').on('click', _.debounce(function() {
      io.socket.post('/admin/deleteOffice', {
        officeId: CozyHR.officeId
      }, function(res) {
        if(res.success) {
          document.location = "/admin/offices";
        } else {
          CozyHR.notify(res.error, {color: 'red', sound: true});
        }
      });
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};

_admin.prototype.initRole = function() {
  $(document).ready(function() {
    // Bind delete role
    $('#btnDeleteRole').on('click', _.debounce(function() {
      io.socket.post('/admin/deleteRole', {
        roleId: CozyHR.roleId
      }, function(res) {
        if(res.success) {
          document.location = "/admin/roles";
        } else {
          CozyHR.notify(res.error, {color: 'red', sound: true});
        }
      });
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};

_admin.prototype.initEmployee = function() {
  $(document).ready(function() {
    // Bind save settings
    $('#btnSaveSettings').on('click', _.debounce(function() {
      io.socket.post('/admin/saveEmployee', {
        userId: CozyHR.editingUserId,
        fullName: $('#txtFullName').val(),
        picture: $('#txtPicture').val()
      }, function(res) {
        if(res.success) {
          CozyHR.notify('Your settings have been saved.', {color: 'green', sound: true});
        } else {
          CozyHR.notify('Failed due to: ' + res.error, {color: 'red', sound: true});
        }
      });
    }, CozyHR.globals.DEFAULT_DEBOUNCE_TIMEOUT, true));
  }.bind(this));
};