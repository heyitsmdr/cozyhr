Cozy.factory('$roles', function($q, $cozy) {

  var roles = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && roles) {
        deferred.resolve(roles);
        return deferred.promise;
      }

      $cozy.get('/api/syncRoles')
        .success(function(companyRoles) {
          roles = companyRoles;
          console.log('$roles', roles);
          deferred.resolve(roles);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    getRoleById: function(roleId) {
      var deferred = $q.defer();

      this.sync(true).then(function() {
        var rolesById = _.indexBy(roles, 'id');
        if(rolesById[roleId]) {
          deferred.resolve( rolesById[roleId] );
        } else {
          deferred.reject();
        }
      });

      return deferred.promise;
    },

    addNewRole: function(role) {
      if(!roles) {
        roles = [];
      }

      roles.push({
        companyAdmin: role.companyAdmin,
        id: role.id,
        jobTitle: role.jobTitle,
        employeeCount: 0
      });
    },

    bindableGetRoles: function() {
      if(roles) {
        return roles;
      } else {
        return [];
      }
    },
  };
});