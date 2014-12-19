Cozy.factory('$authUser', function($q, $sails) {

  var authData = null;

  return {
    sync: function() {
      var deferred = $q.defer();

      if(authData) {
        deferred.resolve(authData);
        return deferred.promise;
      }

      $sails.get('/auth/session').success(function(data) {
        authData = data;

        deferred.resolve(authData);
      });

      return deferred.promise;
    }
  };
});