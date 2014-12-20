Cozy.controller('DashController', function($scope, $rootScope, $feed) {
  $rootScope.subsection = 'Dashboard';

  // First, let's set up Chosen
  $('#feedFilter').chosen({
    placeholder_text_single: 'Select a filter'
  });

  // Next, let's set some scope variables
  $scope.loadingFeed = true;

  // Now, let's sync the feed
  $feed.sync().then(function(feedData) {
    console.log(feedData);

    $scope.feedData = feedData;
    $scope.feedCommentIsVisible = $feed.bindableCommentIsVisible;
    $scope.feedHasHiddenComments = $feed.bindableHasHiddenComments;

    $scope.loadingFeed = false;
  });

  // Finally, let's set up some scope-level methods
  $scope.showMoreComments = function(feedId) {
    $feed.showMoreComments(feedId);
  };

});