Cozy.directive('employeeInfo', function($bounce) {
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

      });
    }

  };
});