Cozy.directive('adminemployees', function($cozy, $rootScope, $bounce, $timeout) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-employees.html',
    link: function($scope) {
      $('#selNewEmployeeRole').chosen({
        width: '200px'
      });

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

      $cozy.get('/admin/getEmployees')
        .then(function(response) {
          $scope.roles = response.roles;
          $scope.invites = response.invites;
          $scope.employees = response.employees;
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

            $scope.invites.push({
              inviteEmail: response.email,
              invitedRole: response.role
            });
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
            $scope.invites = $scope.invites.filter(function(_invite) {
              if(_invite.id === inviteId) {
                return false;
              } else {
                return true;
              }
            });
          }
        });
      });
    }

  };
});