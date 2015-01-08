Cozy.factory('$invites', function($q, $cozy) {

  var invites = null;

  return {
    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && invites) {
        deferred.resolve(invites);
        return deferred.promise;
      }

      $cozy.get('/api/syncInvites')
        .success(function(companyInvites) {
          invites = companyInvites;
          console.log('$invites', invites);
          deferred.resolve(invites);
        })
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    getInviteById: function(inviteId) {
      var deferred = $q.defer();

      this.sync(true).then(function() {
        var invitesById = _.indexBy(invites, 'id');
        if(invitesById[inviteId]) {
          deferred.resolve( invitesById[inviteId] );
        } else {
          deferred.reject();
        }
      });

      return deferred.promise;
    },

    addNewInvite: function(inviteId, inviteEmail, invitedRole) {
      if(!invites) {
        invites = [];
      }

      invites.push({
        id: inviteId,
        inviteEmail: inviteEmail,
        invitedRole: invitedRole
      });
    },

    removeInvite: function(inviteId) {
      invites = invites.filter(function(_invite) {
        if(_invite.id === inviteId) {
          return false;
        } else {
          return true;
        }
      });
    },

    bindableGetInvites: function() {
      if(invites) {
        return invites;
      } else {
        return [];
      }
    },
  };
});