var Cozy = angular.module('cozyhr-app', ['ng', 'ngRoute', 'ngSanitize', 'ngSails']);

Cozy.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/dash', {
      templateUrl: '/templates/dash.html',
      controller: 'DashController'
    })
    .otherwise({
      redirectTo: '/dash'
  });

  $locationProvider
    .html5Mode(false)
    .hashPrefix('!');
});

Cozy.controller('PageController', function($scope, $rootScope, $sails, $authUser) {

  // First, let's set up third-party integrations.
  $(document).on('mouseover', '.tt', function() {
    if(!$(this).data('tt-init')) {
      $(this).jBox('Tooltip');
      $(this).data('tt-init', true);
      $(this).mouseover();
    }
  });

  // Next, disable right click.
  $(document).bind('contextmenu', function(e) {
    e.preventDefault();
  });

  // Then, set up global socket events (can happen anywhere in the app)
  $sails.on('exception', function(exceptionData) {
    //CozyHR.exception(exceptionData.stack);
  });

  // And now, set up global-page scope
  $scope.pageTitle = function() {
    if($rootScope.subsection) {
      return 'CozyHR: ' + $rootScope.subsection;
    } else {
      return 'CozyHR';
    }
  };

  // Next, set up rootScope (avail to all controllers)


  // And finally, only show the app when authenticated.
  // The promise below will only succeed when authenticated.
  $authUser.getUserInfo().then(function() {
    $scope.session = $authUser.getSession();

    console.log('$scope.session', $scope.session);

    ['#topMenu', '#bottomMenu'].forEach(function(_menu) {
      $(_menu).hide().css({opacity: 1}).slideDown();

      $scope.appVisible = true;
    });
  });
});