Cozy.directive('adminRoleJobinfo', function($bounce, $cozy, $location, $roles, $rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-role-jobinfo.html',
    link: function($scope) {

      $roles.getRoleById($scope.id).catch(function() {
        $location.path('/admin/roles');
        $rootScope.notify('The specified role does not exist.', { color: 'red' });
      });

      $scope.saveSettings = $bounce(function() {
        $cozy
          .post('/admin/saveRole', {
            roleId: $scope.id
          })
          .then(function(response) {
            // Nothing with response yet (need to impl on server).
          });
      });

      $scope.deleteRole = $bounce(function() {
        swal({
          title: 'Are you sure?',
          text: 'This role will be deleted from your company!',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes, delete it!',
          closeOnConfirm: false
        }, function() {
          $cozy.post('/admin/deleteRole', {
            roleId: $scope.id
          }).then(function(response) {
            if(response.success === true) {
              swal({
                title: 'Deleted!',
                text: 'The role has been deleted!',
                closeOnConfirm: false
              }, function() {
                swal({title:"", timer:1});
                $location.path('/admin/roles');
                $scope.$apply(); // This is needed since $location.path is being called from outside Angular
              });
            }
          });
        });
      });
    }

  };
});