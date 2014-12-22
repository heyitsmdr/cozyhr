Cozy.factory('$workers', function($q, $sails) {

  var workers = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && workers) {
        deferred.resolve(workers);
        return deferred.promise;
      }

      $sails.get('/api/syncWorkers')
        .success(function(response) {

          deferred.resolve(workers);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    }
  };
});