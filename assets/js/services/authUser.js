Cozy.factory('$authUser', function($q, $sails) {

  var sessionData = null;

  return {
    sync: function() {
      var deferred = $q.defer();

      if(sessionData) {
        deferred.resolve(sessionData);
        return deferred.promise;
      }

      $sails.get('/auth/session')
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

    getUserInfo: function() {
      var deferred = $q.defer();

      this.sync().then(function() {
        if(this.isAuthenticated()) {
          deferred.resolve(sessionData.userinfo);
        } else {
          deferred.reject();
        }
      }.bind(this));

      return deferred.promise;
    },

    getSession: function() {
      return sessionData;
    }
  };
});