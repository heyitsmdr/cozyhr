Cozy.directive('adminGeneral', function($cozy, $rootScope, $bounce) {
  return {
    restrict: 'E',
    templateUrl: 'templates/directives/admin-general.html',
    link: function($scope) {

      $scope.companyName = $scope.session.userinfo.company.name;
      $scope.companyHost = $scope.session.userinfo.company.host.replace('.cozyhr.com', '');
      $scope.viewport = 'general';

      $cozy.get('/admin/getGeneralSettings').then(function() {

      });

      $scope.save = $bounce(function() {
        $cozy.post('/admin/saveGeneral', {
          companyName: $scope.companyName
        })
        .then(function(response) {
          if(response.success) {
            $rootScope.notify('Your company settings have been saved.', { color: 'green' });
          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });

      $scope.changeSubdomain = $bounce(function() {
        $cozy.post('/admin/saveNewSubdomain', {
          subdomain: $scope.companyHost
        })
        .then(function(response) {
          if(response.success) {
            $rootScope.notify('Your company subdomain has been changed.', { color: 'green' });
          } else {
            $rootScope.notify(response.error, { color: 'red' });
          }
        });
      });
    }

  };
});