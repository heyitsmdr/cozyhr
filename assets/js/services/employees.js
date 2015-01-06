Cozy.factory('$employees', function($q, $cozy) {

  var employees = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && employees) {
        deferred.resolve(employees);
        return deferred.promise;
      }

      $cozy.get('/api/syncEmployees')
        .success(function(companyEmployees) {
          employees = companyEmployees;
          console.log('$employees', employees);
          deferred.resolve(employees);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    getEmployeeById: function(employeeId) {
      var deferred = $q.defer();

      this.sync(true).then(function() {
        var employeesById = _.indexBy(employees, 'id');
        if(employeesById[employeeId]) {
          deferred.resolve( employeesById[employeeId] );
        } else {
          deferred.reject();
        }
      });

      return deferred.promise;
    },

    getEmployeesByRole: function(roleId) {
      var deferred = $q.defer();

      this.sync(true).then(function() {
        deferred.resolve( _.where(employees, { roleId: roleId }) );
      });

      return deferred.promise;
    },

    bindableGetEmployees: function() {
      if(employees) {
        return employees;
      } else {
        return [];
      }
    },
  };
});