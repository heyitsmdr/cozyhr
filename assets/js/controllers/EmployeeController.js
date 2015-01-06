Cozy.controller('EmployeeController', function($scope, $rootScope, $employees, $routeParams) {
  $rootScope.subsection = 'Employee';
  $rootScope.pageId = $rootScope.PAGES.EMPLOYEE;

  $scope.subSection = $routeParams.subsection || null;
  $scope.id = $routeParams.id || null;

  $employees.getEmployeeById($scope.id).then(function(_employee) {
    $scope.employee = _employee;
  });
});