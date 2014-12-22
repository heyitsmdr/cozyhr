Cozy.controller('DashController', function($scope, $rootScope, $feed, $offices) {
  $rootScope.subsection = 'Dashboard';
  $rootScope.pageId = 1;

  // First, let's set up Chosen
  $('#feedFilter').chosen({
    placeholder_text_single: 'Select a filter'
  });

  $('#feedFilter').on('change', function(evt, params) {
    localStorage['lastDashFeedFilter'] = params.selected;

    $feed.setFilter( params.selected );
  });

  // Next, let's set some scope variables
  $scope.feedIsSyncing = $feed.bindableFeedIsSyncing;
  $scope.companyOffices = $offices.bindableGetOffices;
  $scope.feedData = $feed.bindableGetFeed;

  $scope.$watch('companyOffices()', function() {
    $scope.$evalAsync(function() {
      $('#feedFilter').trigger('chosen:updated');
    });
  }, true);

  $scope.writeComment = function(feedId, event) {
    if(event.keyCode === 13) {
      $(event.target).prop({ disabled: true });
      $(event.target).css({ color: '#ccc' });
      $feed.writeComment(feedId, event.target.value)
        .finally(function() {
          $(event.target)
            .prop({ disabled: false })
            .css({ color: '#000' })
            .val('')
            .focus();
        });
    }
  };

  $scope.removeComment = function(commentId) {
    $feed.removeComment(commentId)
      .catch(function() {
        $rootScope.notify('There was an error deleting the comment.', { color: 'red' });
      });
  };

  // Now, let's sync the feed
  $feed.resetVisibility().sync().then(function() {
    $scope.feedCommentIsVisible = $feed.bindableCommentIsVisible;
    $scope.feedHasHiddenComments = $feed.bindableHasHiddenComments;
  });

  // Then, let's sync the offices
  $offices.sync(true);

  // Finally, let's set up some scope-level methods
  $scope.showMoreComments = function(feedId) {
    $feed.showMoreComments(feedId);
  };

});