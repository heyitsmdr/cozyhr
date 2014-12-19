Cozy.factory('$feed', function($q, $sails) {

  var feeds = null;

  return {
    sync: function() {
      var deferred = $q.defer();

      if(feeds) {
        deferred.resolve(feeds);
        return deferred.promise;
      }

      $sails.get('/dash/syncFeed', { filter: 'all', start: 0 })
        .success(function(data) {
          feeds = data;
          deferred.resolve(feeds);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    }
  };
});