var _admin = CozyHR.pageHelpers.admin = function() { };

_admin.prototype.init = function() {
  return this;
};

_admin.prototype.initGeneral = function() {
  $(document).ready(function() {
    // Bind
    CozyHR.bindClick('#btnChangeSubdomain', function() {
      $('#generalSettingsContainer').hide('slide', function() {
        $('#changeSubdomainContainer').show('slide');
      });
    });
    CozyHR.bindClick('#btnBackToGeneral', function() {
      $('#changeSubdomainContainer').hide('slide', function() {
        $('#generalSettingsContainer').show('slide');
      });
    });
    CozyHR.bindClick('#btnSaveSettings', function() {
      io.socket.post('/admin/saveGeneral', {
        companyName: $('#txtCompanyName').val(),
      }, function(res) {
        if(res.success) {
          CozyHR.notify('Your company settings have been saved.', {color: 'green', sound: true});
        } else {
          CozyHR.notify('Failed due to: ' + res.error, {color: 'red', sound: true});
        }
      });
    });
    CozyHR.bindClick('#btnConfirmSubdomainChange', function() {
      if($('#txtCompanySubdomain').val() == $('#txtCurrentCompanySubdomain').val().split('.')[0]) {
        return CozyHR.notify('You must pick a new subdomain to use.', { color:' red', sound: true });
      }
      io.socket.post('/admin/saveNewSubdomain', {
        subdomain: $('#txtCompanySubdomain').val()
      }, function(res) {
        if(res.success) {
          document.location = "http://" + $('#txtCompanySubdomain').val().toLowerCase() + ((CozyHR.env!='production')?'.dev':'') + ".cozyhr.com/";
        } else {
          CozyHR.notify(res.error, {color: 'red', sound: true});
        }
      });
    });
  });
};

_admin.prototype.initEmployees = function() {
  $(document).ready(function() {
    // Set up the table
    $('#companyEmployees').dataTable({
      pageLength: 50,
      language: {
        emptyTable: "There are no employees to display here."
      }
    });
    // Bind click event to invite a new employee
    if($('#selNewEmployeeRole')) {
      $('#selNewEmployeeRole').chosen({width:'200px'});
    }

    CozyHR.bindTextClick('#txtNewEmployeeEmail', '#btnInviteEmployee', function() {
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
    });
  }.bind(this));
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
    CozyHR.bindTextClick('#txtNewRole', '#btnCreateRole', function() {
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
    });
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
    CozyHR.bindTextClick('#txtNewOffice', '#btnConstructOffice', function() {
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
    });
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
    CozyHR.bindTextClick('#txtNewPosition', '#btnNewPosition', function() {
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
    });

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
    CozyHR.bindClick('#btnDeleteOffice', function() {
      CozyHR.confirm('Do you really want to delete this office from your company?', {
        confirmText: 'Yes, delete the office!',
        cancelText: 'No, keep it.',
        confirmSuccess: 'The office has been deleted!',
        cancelSuccess: 'The office has not been deleted.',
        preConfirmCallback: function(success) {
          io.socket.post('/admin/deleteOffice', {
            officeId: CozyHR.officeId
          }, function(res) {
            if(!res.success) {
              CozyHR.notify(res.error, {color: 'red', sound: true});
            } else {
              success();
            }
          });
        },
        confirmCallback: function() {
          document.location = "/admin/offices";
        }
      });
    });
  }.bind(this));
};

_admin.prototype.initRole = function() {
  $(document).ready(function() {

    // Load Mustache Templates
    $('#ptoAccrualContainer').html(Mustache.render(CozyHR.templates['accrualSetting'], { id: 'pto' }));
    $('#sickAccrualContainer').html(Mustache.render(CozyHR.templates['accrualSetting'], { id: 'sick' }));
    $('#vacaAccrualContainer').html(Mustache.render(CozyHR.templates['accrualSetting'], { id: 'vaca' }));

    // Bind delete role
    CozyHR.bindClick('#btnDeleteRole', function() {
      CozyHR.confirm('Do you really want to delete this role from your company?', {
        confirmText: 'Yes, delete the role!',
        cancelText: 'No, keep it.',
        confirmSuccess: 'The role has been deleted!',
        cancelSuccess: 'The role has not been deleted.',
        preConfirmCallback: function(success) {
          io.socket.post('/admin/deleteRole', {
            roleId: CozyHR.roleId
          }, function(res) {
            if(!res.success) {
              CozyHR.notify(res.error, {color: 'red', sound: true});
            } else {
              success();
            }
          });
        },
        confirmCallback: function() {
          document.location = "/admin/roles";
        }
      });
    });

  }.bind(this));
};

_admin.prototype.initEmployee = function() {
  $(document).ready(function() {
    // Bind save settings
    $('#btnSaveSettings').on('click', _.debounce(function() {
      io.socket.post('/admin/saveEmployee', {
        userId: CozyHR.editingUserId,
        fullName: $('#txtFullName').val(),
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