Cozy.controller('DashController', function($scope, $rootScope, $feed, $offices, $workers, $bounce) {
  $rootScope.subsection = 'Dashboard';
  $rootScope.pageId = $rootScope.PAGES.DASHBOARD;

  // First, let's set up Chosen
  $('#feedFilter').chosen();

  $('#feedFilter').on('change', function(evt, params) {
    localStorage.lastDashFeedFilter = params.selected;

    $feed.setFilter( params.selected );
  });

  // Next, let's set some scope variables
  $scope.feedIsSyncing = $feed.bindableFeedIsSyncing;
  $scope.feedCommentIsVisible = $feed.bindableCommentIsVisible;
  $scope.feedHasHiddenComments = $feed.bindableHasHiddenComments;
  $scope.feedData = $feed.bindableGetFeed;
  $scope.companyOffices = $offices.bindableGetOffices;
  $scope.workersIsSyncing = $workers.bindableIsSyncing;
  $scope.clockedWorkers = $workers.bindableGetWorkers;

  $scope.$watch('companyOffices()', function() {
    $scope.$evalAsync(function() {
      $('#feedFilter').val( localStorage.lastDashFeedFilter || $('#feedFilter option:first').val() ).trigger('chosen:updated');
    });
  }, true);

  $scope.writeComment = function(feedId, event) {
    if(event.keyCode === 13) {
      $scope._writeComment(feedId, event);
    }
  };

  $scope._writeComment = $bounce(function(feedId, event) {
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
  });

  $scope.removeComment = $bounce(function(commentId) {
    $feed.removeComment(commentId)
      .catch(function() {
        $rootScope.notify('There was an error deleting the comment.', { color: 'red' });
      });
  });

  // Now, let's sync the feed
  $feed.resetVisibility().sync();

  // Then, let's sync the offices
  $offices.sync(true);

  // And then, let's sync the workers
  $workers.sync(true);

  // Finally, let's set up some scope-level methods
  $scope.showMoreComments = function(feedId) {
    $feed.showMoreComments(feedId);
  };

});