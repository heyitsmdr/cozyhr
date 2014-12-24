Cozy.directive('adminRoles', function($cozy, $rootScope, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-roles.html',
    link: function($scope) {

      $cozy.get('/admin/getRoles')
        .then(function(response) {
          $scope.roles = response;
        });

      $scope.$watch('roles', function(newValue) {
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

      });

    }

  };
});