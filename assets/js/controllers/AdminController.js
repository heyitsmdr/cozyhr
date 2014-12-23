Cozy.controller('AdminController', function($scope, $rootScope, $routeParams) {
  $rootScope.subsection = 'Admin';
  $rootScope.pageId = $rootScope.PAGES.ADMIN;

  $scope.crumbs = [{ name: 'Blah', location: '/#!/dash' }];

});