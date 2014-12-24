Cozy.controller('SigninController', function($scope, $rootScope, $bounce, $cozy, $location, $authUser, companyData) {
  $scope.companyExists = companyData.companyExists;
  $scope.errorMessage = 'Press enter to sign in.';
  $scope.signin = {};

  if($scope.companyExists) {
    $scope.companyName = companyData.companyName;
  }

  $scope.signin = $bounce(function() {
    if($scope.signin.email && $scope.signin.password) {
      $cozy.post('/auth/attemptSignin', {
        email: $scope.signin.email,
        password: $scope.signin.password,
        host: $location.host().replace('.dev', '')
      })
      .then(function(response) {
        if(response.success) {
          $authUser.sync(false).then(function() {
            $location.path('/dash');
          });
        } else {
          $scope.errorMessage = response.error;
        }
      });
    }
  });

  $('#logo').hide().toggle('drop', { direction: 'up' });

  $('input:first').focus();
});