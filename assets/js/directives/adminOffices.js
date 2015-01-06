Cozy.directive('adminOffices', function($cozy, $rootScope, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-offices.html',
    link: function($scope) {

      $cozy.get('/admin/getOffices').then(function(response) {
        $scope.offices = response;
      });

      $scope.$watch('offices.length', function(newValue) {
        $('#companyOffices').dataTable({
          "destroy": true,
          "pageLength": 50,
          "columns": [
            { "data": "name", "render": function(d,t,r,m) { return "<a href='/#!/admin/office/" + r.id + "'>"+d+"</a>"; } },
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