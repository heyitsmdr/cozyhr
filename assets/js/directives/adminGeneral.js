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
            $cozy.notify('Your company settings have been saved.', { color: 'green' });
          } else {
            $cozy.notify(response.error, { color: 'red' });
          }
        });
      });

      $scope.changeSubdomain = $bounce(function() {
        if($scope.companyHost === $scope.session.userinfo.company.host.split('.')[0]) {
          return $cozy.notify('You\'re already using that subdomain! Pick a new one.', { color: 'red' });
        }

        $cozy.confirm({
          title: 'Are you sure?',
          text: 'The company subdomain will be changed and everyone will need to access it and re-login using the new URL.',
          confirm: 'Yes, change it!',
          confirmed: function(success) {
            $cozy
              .post('/admin/saveNewSubdomain', {
                subdomain: $scope.companyHost
              })
              .then(function(response) {
                if(response.success) {
                  success({
                    title: 'Changed!',
                    text: 'Your company subdomain has been changed! You will now be redirected to the new URL.',
                    confirmed: function() {
                      document.location = 'http://' + $scope.companyHost + '.cozyhr.com/#!/signin';
                    }
                  });
                } else {
                  $cozy.notify(response.error, { color: 'red' });
                }
              });
          }
        });

      });
    }

  };
});