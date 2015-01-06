Cozy.directive('adminOfficePositions', function($cozy, $location, $rootScope, $bounce, $compile) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-office-positions.html',
    link: function($scope) {

      $cozy.get('/admin/getOfficePositions', {
        officeId: $scope.id
      }).then(function(response) {
        if(response.success) {
          $scope.positions = response.positions;
        } else {
          $location.path('/admin/offices');
          $rootScope.notify('The specified office does not exist.', { color: 'red' });
        }
      });

      $scope.$watch('positions.length', function() {
        $('#companyOfficePositions').dataTable({
          "destroy": true,
          "pageLength": 50,
          "language": {
            "emptyTable": "No positions have been created at this location."
          },
          "columns": [
            { "data": "name", "render": function(d) { return d; } },
            { "data": "delete", "render": function(d) { return "&nbsp;<span class='span-link delete-position' ng-click='deletePosition(\"" + d + "\")'><i class='fa fa-times'></i></a>"; } }
          ],
          "data": $scope.positions || [],
          "createdRow": function(row) {
            $compile( angular.element(row).contents() )($scope);
          }
        });
      });

      $scope.createPosition = $bounce(function() {
        if(!$scope.positionName || $scope.positionName.replace(/ /g, '').length === 0) {
          return;
        }

        $cozy.post('/admin/createOfficePosition', {
          positionName: $scope.positionName,
          officeId: $scope.id
        })
        .then(function(response) {
          if(response.success) {
            $scope.positionName = '';

            $scope.positions.push({
              name: response.position.name,
              delete: response.position.id
            });
          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });

      $scope.deletePosition = $bounce(function(positionId) {
        $cozy.post('/admin/deleteOfficePosition', {
          positionId: positionId
        })
        .then(function(response) {
          if(response.success) {
            $scope.positions = $scope.positions.filter(function(_position) {
              if(_position.delete === positionId) {
                return false;
              } else {
                return true;
              }
            });
          }
        });
      });

      $scope.deleteOffice = $bounce(function() {
        swal({
          title: 'Are you sure?',
          text: 'This office and the associated positions will be deleted from your company!',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, delete it!',
          closeOnConfirm: false
        }, function() {
          $cozy.post('/admin/deleteOffice', {
            officeId: $scope.id
          }).then(function(response) {
            if(response.success === true) {
              swal({
                title: 'Deleted!',
                text: 'The office has been deleted!',
                closeOnConfirm: false
              }, function() {
                swal({title:"", timer:1});
                $location.path('/admin/offices');
                $scope.$apply(); // This is needed since $location.path is being called from outside Angular
              });
            }
          });
        });
      });
    }

  };
});