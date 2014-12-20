Cozy.factory('$feed', function($q, $sails, $timeout) {

  var feeds = null;
  var filter = 'all';
  var commentVisibilityTracker = {};

  return {
    sync: function() {
      var deferred = $q.defer();

      if(feeds) {
        deferred.resolve(feeds);
        return deferred.promise;
      }

      $sails.get('/dash/syncFeed', { filter: filter, start: 0 })
        .success(function(data) {
          feeds = data;
          this.initVisibility();
          deferred.resolve(feeds);
        }.bind(this))
        .error(function() {
          deferred.reject();
        });

      return deferred.promise;
    },

    initVisibility: function() {
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
        }
      });
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
    }
  };
});