Cozy.factory('$offices', function($q, $sails) {

  var offices = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && offices) {
        deferred.resolve(offices);
        return deferred.promise;
      }

      $sails.get('/api/syncOffices')
        .success(function(companyOffices) {
          offices = companyOffices;
          console.log('$offices', offices);
          deferred.resolve(offices);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    bindableGetOffices: function() {
      if(offices) {
        return offices;
      } else {
        return [];
      }
    }
  };
});