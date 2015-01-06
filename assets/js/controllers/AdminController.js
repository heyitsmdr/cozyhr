Cozy.controller('AdminController', function($scope, $rootScope, $routeParams, $offices, $roles, $location) {
  $rootScope.subsection = 'Admin';
  $rootScope.pageId = $rootScope.PAGES.ADMIN;

  $scope.adminSection = $routeParams.subpage;
  $scope.adminSubsection = $routeParams.subsection || null;
  $scope.id = $routeParams.id || null;
  $scope.sidebarType = 'default';

  switch($scope.adminSection) {
    case 'general':
      $scope.crumbs = [{ name: 'General', location: '/#!/admin/general' }];
      break;
    case 'employees':
      $scope.crumbs = [{ name: 'Employees', location: '/#!/admin/employees' }];
      break;
    case 'roles':
      $scope.crumbs = [{ name: 'Roles', location: '/#!/admin/roles' }];
      break;
    case 'offices':
      $scope.crumbs = [{ name: 'Offices & Positions', location: '/#!/admin/offices' }];
      break;
    case 'office':
      $scope.sidebarType = 'office';

      $offices.getOfficeById($scope.id).then(function(officeDetails) {
        $scope.officeName = officeDetails.name;

        $scope.crumbs = [
          { name: 'Offices & Positions', location: '/#!/admin/offices' },
          { name: officeDetails.name, location: '/#!/admin/office/' + officeDetails.id }
        ];
      });
      break;
    case 'role':
      $scope.sidebarType = 'role';

      $roles.getRoleById($scope.id).then(function(roleDetails) {
        $scope.roleName = roleDetails.jobTitle;

        $scope.crumbs = [
          { name: 'Roles', location: '/#!/admin/roles' },
          { name: roleDetails.jobTitle, location: '/#!/admin/role/' + roleDetails.id }
        ];
      });
      break;
  }

  // Default Subsections
  if($scope.adminSection === 'office' && !$scope.adminSubsection) {
    $location.path('/admin/office/' + $scope.id + '/positions');
  }
  else if($scope.adminSection === 'role' && !$scope.adminSubsection) {
    $location.path('/admin/role/' + $scope.id + '/job');
  }
});