Cozy.directive('adminEmployees', function($cozy, $rootScope, $bounce, $timeout, $invites, $employees, $roles) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-employees.html',
    link: function($scope) {
      $('#selNewEmployeeRole').chosen({
        width: '200px'
      });

      $employees.sync().then(function(_employees) {
        $scope.employees = _employees;
      });

      $roles.sync().then(function(_roles) {
        $scope.roles = _roles;
      });

      $scope.getInvites = $invites.bindableGetInvites;

      $invites.sync();

      $scope.$watch('employees', function(newValue) {
        if(!newValue) {
          return;
        }

        $timeout(function() {
          $('#companyEmployees').dataTable({
            pageLength: 50,
            language: {
              emptyTable: "There are no employees to display here."
            }
          });
        });
      });

      $scope.$watch('roles', function() {
        $scope.$evalAsync(function() {
          $('#selNewEmployeeRole').trigger('chosen:updated');
        });
      });

      $scope.sendInvite = $bounce(function() {
        if(!$scope.inviteEmployeeEmail) {
          return;
        }

        $cozy.post('/admin/createInvite', {
          email: $scope.inviteEmployeeEmail,
          role: $('#selNewEmployeeRole').val()
        })
        .then(function(response) {
          if(response.success) {
            if(!$scope.invites) {
              $scope.invites = [];
            }

            $scope.inviteEmployeeEmail = '';

            $invites.addNewInvite(response.inviteId, response.email, response.role);
          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });

      $scope.deleteInvite = $bounce(function(inviteId) {
        $cozy.post('/admin/deleteInvite', {
          id: inviteId
        })
        .then(function(response) {
          if(response.success) {
            $invites.removeInvite(inviteId);
          }
        });
      });
    }

  };
});