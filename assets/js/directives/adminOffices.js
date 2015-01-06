Cozy.directive('adminOffices', function($cozy, $rootScope, $offices, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-offices.html',
    link: function($scope) {

      $offices.sync().then(function(companyOffices) {
        $scope.offices = companyOffices;
      });

      $scope.$watch('offices.length', function() {
        $('#companyOffices').dataTable({
          "destroy": true,
          "pageLength": 50,
          "columns": [
            { "data": "name", "render": function(d,t,r) { return "<a href='/#!/admin/office/" + r.id + "'>"+d+"</a>"; } },
            { "data": "positionCount" }
          ],
          "data": $scope.offices || []
        });
      });

      $scope.createOffice = $bounce(function() {
        if(!$scope.officeName) {
          return;
        }

        $cozy.post('/admin/createOffice', {
          officeName: $scope.officeName
        })
        .then(function(response) {
          if(response.success) {
            $scope.officeName = '';

            $scope.offices.push({
              id: response.office.id,
              name: response.office.name,
              positionCount: 0
            });

          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });

    }

  };
});