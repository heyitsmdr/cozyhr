var Cozy = angular.module('cozyhr-app', ['ng', 'ngRoute', 'ngSails']);

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

Cozy.controller('PageController', function($scope, $rootScope, $authUser) {
  $scope.pageTitle = function() {
    if($rootScope.subsection) {
      return 'CozyHR: ' + $rootScope.subsection;
    } else {
      return 'CozyHR';
    }
  };

  $scope.currentUser = null;

  $authUser.sync().then(function(authData) {
    $scope.currentUser = authData;

    ['#topMenu', '#bottomMenu'].forEach(function(_menu) {
      $(_menu).hide().css({opacity: 1}).slideDown();
    });
  });
});