Cozy.directive('adminRoles', function($cozy, $rootScope, $roles, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-roles.html',
    link: function($scope) {

      $roles.sync().then(function(companyRoles) {
        $scope.roles = companyRoles;
      });

      $scope.$watch('roles.length', function() {
        $('#companyRoles').dataTable({
          "destroy": true,
          "pageLength": 50,
          "columns": [
            { "data": "jobTitle", "render": function(d,t,r,m) { return "<a href='/#!/admin/role/" + r.id + "'>"+d+"</a>"; } },
            { "data": "employeeCount" }
          ],
          "data": $scope.roles || []
        });
      });

      $scope.createRole = $bounce(function() {
        if(!$scope.roleName) {
          return;
        }

        $cozy
          .post('/admin/createRole', {
            roleName: $scope.roleName
          })
          .then(function(response) {
            if(response.success) {
              $roles.addNewRole(response.role);
              $scope.roleName = '';
            } else {
              $rootScope.notify(response.error, { color: 'red' });
            }
          });
      });

    }

  };
});