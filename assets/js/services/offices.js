Cozy.factory('$offices', function($q, $cozy) {

  var offices = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && offices) {
        deferred.resolve(offices);
        return deferred.promise;
      }

      $cozy.get('/api/syncOffices')
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

    getOfficeById: function(officeId) {
      var deferred = $q.defer();

      if(offices) {
        var officesById = _.indexBy(offices, 'id');
        if(officesById[officeId]) {
          deferred.resolve(officesById[officeId]);
          return deferred.promise;
        }
      }

      this.sync(false).then(function() {
        var officesById = _.indexBy(offices, 'id');
        if(officesById[officeId]) {
          deferred.resolve( officesById[officeId] );
        } else {
          deferred.reject();
        }
      });

      return deferred.promise;
    },

    bindableGetOffices: function() {
      if(offices) {
        return offices;
      } else {
        return [];
      }
    },
  };
});