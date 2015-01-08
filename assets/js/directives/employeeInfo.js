Cozy.directive('employeeInfo', function($rootScope, $bounce, $cozy) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/employee-info.html',
    link: function($scope) {

      $scope.$watch('employee', function(newValue) {
        if(!newValue) {
          return;
        }

        $scope.fullName = $scope.employee.firstName + ' ' + $scope.employee.lastName;
      });

      $scope.saveSettings = $bounce(function() {
        if(!$scope.fullName) {
          return;
        }

        $cozy.post('/api/saveEmployeeInfo', {
          userId: $scope.id,
          fullName: $scope.fullName
        }).then(function(response) {
          if(response.success) {
            $rootScope.notify('Your profile has been updated!', { color: 'green' });
          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });
    }

  };
});