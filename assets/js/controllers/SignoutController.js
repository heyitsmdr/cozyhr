Cozy.controller('SignoutController', function($cozy, $authUser, $location) {

  $cozy.post('/auth/signout')
    .then(function(response) {
      if(response.success) {
        $authUser.sync(false).then(function() {
          $location.path('/signin');
        });
      }
    });
});