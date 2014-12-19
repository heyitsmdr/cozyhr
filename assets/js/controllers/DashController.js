Cozy.controller('DashController', function($scope, $rootScope, $feed) {

  // First, let's set up Chosen
  $('#feedFilter').chosen({
    placeholder_text_single: 'Select a filter'
  });

  // Now, let's sync the feed
  $feed.sync().then(function(feedData) {
    $scope.feedData = feedData;
  });
});