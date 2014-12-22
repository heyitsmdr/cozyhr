Cozy.factory('$feed', function($q, $sails, $timeout, $rootScope) {

  var feeds = null;
  var filter = 'all';
  var commentVisibilityTracker = {};
  var syncing = true;
  var sailsEvents = null;

  return {
    _onDashSync: function() {
      if($rootScope.pageId === $rootScope.PAGES.DASHBOARD) {
        this.sync();
      }
    },

    _onAddedComment: function(response) {
      if($rootScope.pageId === $rootScope.PAGES.DASHBOARD) {
        console.log('Adding comment', response);
        // Add to feeds
        feeds.forEach(function(_feed) {
          if(_feed.feedid === response.feedId) {
            _feed.comments.push( response.comment );
          }
        });
        // Make sure visibility is correct
        this.checkVisibility();
      }
    },

    _onRemovedComment: function(response) {
      if($rootScope.pageId === $rootScope.PAGES.DASHBOARD) {
        console.log('Removing comment', response);
        // Remove from feeds
        feeds.forEach(function(_feed) {
          _feed.comments = _feed.comments.filter(function(_comment) {
            if(_comment.id === response.commentId) {
              // Remove from visibility tracker
              delete commentVisibilityTracker[_feed.feedid][_comment.id];
              return false;
            } else {
              return true;
            }
          });
        });
        // Make sure visibility is correct
        this.checkVisibility();
      }
    },

    sync: function(useCache) {
      var deferred = $q.defer();

      if(useCache && feeds) {
        deferred.resolve(feeds);
        return deferred.promise;
      }

      if(sailsEvents === null) {
        $sails.on('dashSync', this._onDashSync.bind(this));
        $sails.on('addedComment', this._onAddedComment.bind(this));
        $sails.on('removedComment', this._onRemovedComment.bind(this));
        sailsEvents = true;
      }

      syncing = true;

      $sails.get('/dash/syncFeed', { filter: filter, start: 0 })
        .success(function(data) {
          feeds = data;
          this.checkVisibility();
          syncing = false;
          commentPendingSync = false;
          console.log(feeds);
          deferred.resolve(feeds);
        }.bind(this))
        .error(function() {
          syncing = false;
          commentPendingSync = false;
          deferred.reject();
        });

      return deferred.promise;
    },

    checkVisibility: function() {
      if(!feeds) {
        return;
      }

      feeds.forEach(function(_feed) {
        if(!commentVisibilityTracker[_feed.feedid]) {
          commentVisibilityTracker[_feed.feedid] = {};

          // Set all the comments to hidden
          _feed.comments.forEach(function(_comment) {
            commentVisibilityTracker[_feed.feedid][_comment.id] = false;
          });

          // Now, let's make the last five comments visible
          _feed.comments.slice(-5).forEach(function(_comment) {
            commentVisibilityTracker[_feed.feedid][_comment.id] = true;
          });
        } else {
          // Always make sure last 5 are visible
          _feed.comments.slice(-5).forEach(function(_comment) {
            commentVisibilityTracker[_feed.feedid][_comment.id] = true;
          });
        }
      });
    },

    resetVisibility: function() {
      commentVisibilityTracker = {};
      return this;
    },

    setFilter: function(newFilter) {
      filter = newFilter;
      this.resetVisibility().sync();
    },

    showMoreComments: function(feedId) {
      if(!feeds || !commentVisibilityTracker[feedId]) {
        return;
      }

      var hiddenComments = [];

      for(var _commentId in commentVisibilityTracker[feedId]) {
        if(commentVisibilityTracker[feedId][_commentId] === false) {
          hiddenComments.push(_commentId);
        }
      }

      hiddenComments.slice(-5).forEach(function(_comment) {
        commentVisibilityTracker[feedId][_comment] = true;
      });
    },

    writeComment: function(feedId, comment) {
      var deferred = $q.defer();

      $sails.post('/dash/writeComment', { feedid: feedId, comment: comment })
        .success(function(response) {
          if(response.success) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        });

      return deferred.promise;
    },

    removeComment: function(commentId) {
      var deferred = $q.defer();

      $sails.post('/dash/removeComment', { commentId: commentId })
        .success(function(response) {
          if(response.success) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        });

      return deferred.promise;
    },

    bindableCommentIsVisible: function(feedId, commentId) {
      if( !!commentVisibilityTracker[feedId] && !!commentVisibilityTracker[feedId][commentId] ) {
        return commentVisibilityTracker[feedId][commentId];
      } else {
        return false;
      }
    },

    bindableHasHiddenComments: function(feedId) {
      if( !!commentVisibilityTracker[feedId] ) {
        for(var _commentId in commentVisibilityTracker[feedId]) {
          if(commentVisibilityTracker[feedId][_commentId] === false) {
            return true;
          }
        }

        return false;
      } else {
        return false;
      }
    },

    bindableFeedIsSyncing: function() {
      return syncing;
    },

    bindableGetFeed: function() {
      if(feeds) {
        return feeds;
      } else {
        return [];
      }
    }
  };
});