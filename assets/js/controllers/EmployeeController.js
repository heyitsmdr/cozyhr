Cozy.controller('EmployeeController', function($scope, $rootScope, $location, $employees, $routeParams) {
  $rootScope.subsection = 'Employee';
  $rootScope.pageId = $rootScope.PAGES.EMPLOYEE;

  $scope.subSection = $routeParams.subsection || null;
  $scope.id = $routeParams.id || null;

  $employees
    .getEmployeeById($scope.id)
    .then(function(_employee) {
      $scope.employee = _employee;
    })
    .catch(function() {
      $location.path('/dash');
      $rootScope.notify('The specified employee does not exist.', { color: 'red' });
    });
});