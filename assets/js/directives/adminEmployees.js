Cozy.directive('adminemployees', function($sails, $rootScope, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-employees.html',
    link: function($scope) {
      $('#selNewEmployeeRole').chosen({
        width: '200px'
      });

      $sails.get('/admin/getEmployees')
        .then(function(response) {
          $scope.roles = response.roles;
          $scope.invites = response.invites;
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

        $sails.post('/admin/createInvite', {
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
    }

  };
});