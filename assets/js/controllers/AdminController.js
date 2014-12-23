Cozy.controller('AdminController', function($scope, $rootScope, $routeParams) {
  $rootScope.subsection = 'Admin';
  $rootScope.pageId = $rootScope.PAGES.ADMIN;

  $scope.adminsection = $routeParams.subpage;

  switch($scope.adminsection) {
    case 'general':
      $scope.crumbs = [{ name: 'General', location: '/#!/admin/general' }];
      break;
    case 'employees':
      $scope.crumbs = [{ name: 'Employees', location: '/#!/admin/employees' }];
      break;
  }


});