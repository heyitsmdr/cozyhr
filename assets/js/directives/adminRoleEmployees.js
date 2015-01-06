Cozy.directive('adminRoleEmployees', function($rootScope, $timeout, $employees) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-role-employees.html',
    link: function($scope) {

      $employees.sync().then(function() {
        $employees
          .getEmployeesByRole($scope.id)
          .then(function(roleEmployees) {
            $scope.roleEmployees = roleEmployees;
          });
      });

      $scope.$watch('roleEmployees', function(newValue) {
        if(!newValue) {
          return;
        }

        $timeout(function() {
          $('#roleEmployees').dataTable({
            pageLength: 50,
            language: {
              emptyTable: "There are no employees to display here."
            }
          });
        });
      });

    }

  };
});