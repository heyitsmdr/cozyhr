Cozy.factory('$authUser', function($q, $cozy) {

  var sessionData = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && sessionData) {
        deferred.resolve(sessionData);
        return deferred.promise;
      }

      $cozy.get('/auth/session')
        .success(function(data) {
          sessionData = data;

          deferred.resolve(sessionData);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    isAuthenticated: function() {
      return (!!sessionData.authenticated);
    },

    getSession: function() {
      return sessionData;
    }
  };
});