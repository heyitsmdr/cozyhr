Cozy.directive('relativetime', function($rootScope, $interval) {
  return {
    restrict: 'E',
    scope: {
      timestamp: '=timestamp'
    },
    template: 'Just now',
    link: function(scope, element) {
      element.on('$destroy', function() {
        $interval.cancel(intervalId);
      });

      var updateElement = function() {
        var previousTimestamp = ( (scope.timestamp === 'now') ? Date.now() : scope.timestamp);

        element.html( $rootScope.fancyDate(new Date(previousTimestamp), new Date(), true) );
      };

      var intervalId = $interval(function() {
        updateElement();
      }, 60000);

      updateElement();
    }
  };
});