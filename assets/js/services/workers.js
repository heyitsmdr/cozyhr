Cozy.factory('$workers', function($q, $sails) {

  var workers = null;
  var syncing = false;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && workers) {
        deferred.resolve(workers);
        return deferred.promise;
      }

      syncing = true;

      $sails.get('/api/syncWorkers')
        .success(function(clockedInWorkers) {
          workers = clockedInWorkers;
          syncing = false;
          console.log('$workers', clockedInWorkers);
          deferred.resolve(workers);
        })
        .error(function() {
          syncing = false;
          deferred.reject();
        });

      return deferred.promise;
    },

    bindableIsSyncing: function() {
      return syncing;
    },

    bindableGetWorkers: function() {
      if(workers) {
        return workers;
      } else {
        return [ ];
      }
    }
  };
});