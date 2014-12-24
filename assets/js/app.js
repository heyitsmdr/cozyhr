var Cozy = angular.module('cozyhr-app', ['ng', 'ngRoute', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngSails']);

var companyInfo = function($q, $cozy, $location) {
  var deferred = $q.defer();

  $cozy.get('/auth/getCompanyInfo', {
    host: $location.host().replace('.dev', '')
  })
  .then(function(response) {
    deferred.resolve(response);
  });

  return deferred.promise;
};

var mustBeAuthenticated = function($q, $rootScope, $location, $authUser) {
  var deferred = $q.defer();

  $authUser.sync(true).then(function() {
    console.log($rootScope.session);

    if($rootScope.session.authenticated) {
      deferred.resolve(true);
    } else {
      deferred.reject();
      $location.path('/signin');
    }
  });

  return deferred.promise;
};

var mustBeAuthenticatedWithAdmin = function($q, $rootScope, $location, $authUser) {
  var deferred = $q.defer();

  mustBeAuthenticated($q, $rootScope, $location, $authUser)
    .then(function() {
      if($rootScope.session.userinfo.role.companyAdmin) {
        deferred.resolve(true);
      } else {
        deferred.reject();
      }
    })
    .catch(function() {
      deferred.reject();
    });

  return deferred.promise;
};

Cozy.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/signin', {
      templateUrl: '/templates/signin.html',
      controller: 'SigninController',
      resolve: {
        companyData: companyInfo
      }
    })
    .when('/signout', {
      controller: 'SignoutController',
      template: '',
      resolve: {
        factory: mustBeAuthenticated
      }
    })
    .when('/dash', {
      templateUrl: '/templates/dash.html',
      controller: 'DashController',
      resolve: {
        factory: mustBeAuthenticated
      }
    })
    .when('/admin/:subpage', {
      templateUrl: '/templates/admin.html',
      controller: 'AdminController',
      resolve: {
        factory: mustBeAuthenticatedWithAdmin,
      }
    })
    .otherwise({
      redirectTo: '/dash'
  });

  $locationProvider
    .html5Mode(false)
    .hashPrefix('!');
});

Cozy.controller('PageController', function($scope, $rootScope, $sails, $authUser, $q, $location) {

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
    console.log("%c E X C E P T I O N ", "color: #fff; background-color: #000");
    console.log(exceptionData.stack);
  });

  // And now, set up global-page scope
  $scope.includeContentLoaded = false;
  $scope.contentLoadedCount = 0;

  $scope.pageTitle = function() {
    if($rootScope.subsection) {
      return 'CozyHR: ' + $rootScope.subsection;
    } else {
      return 'CozyHR';
    }
  };

  var appDeferred = $q.defer();
  $scope.promiseAppLoaded = appDeferred.promise;

  $scope.$on('$includeContentLoaded', function() {
    $scope.contentLoadedCount++;

    if($scope.contentLoadedCount < 2) {
      return;
    }

    $scope.includeContentLoaded = true;

    appDeferred.resolve(true);
  });

  $scope.promiseAppLoaded.then(function() {
    skel.init({
      prefix: null,
      normalizeCSS: true,
      boxModel: 'border',
      grid: { gutters: [40, 0] },
      breakpoints: {
        wide: { range: "1200-", containers: 1140, grid: { gutters: 20 } },
        narrow: { range: "481-1199", containers: 960 },
        mobile: { range: "-480", containers: "fluid", lockViewport: true, grid: { collapse: true } }
      },
      plugins: {
        layers: {
          topMenu: {
            position: "top-left",
            width: "100%",
            height: 41
          },

          bottomMenu: {
            position: "bottom-left",
            width: "100%",
            height: 41
          }
        }
      }
    });

    $scope.appVisible = true;

    $scope.$watch('session.authenticated', function(newValue) {
      if(newValue === true) {
        $scope.$evalAsync(function() {
          ['#topMenu', '#bottomMenu'].forEach(function(_menu) {
            $(_menu).hide().css({opacity: 1}).slideDown();
          });
        });
      } else {
        $scope.$evalAsync(function() {
          ['#topMenu', '#bottomMenu'].forEach(function(_menu) {
            $(_menu).slideUp();
          });
        });
      }
    });
  });

  // Next, set up rootScope (avail to all controllers)
  $rootScope.PAGES = {
    ADMIN: 0,
    DASHBOARD: 1
  };

  $rootScope.fancyDate = function(a, b, fancyReturn, opt) {
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
    var _MS_PER_HOUR = 1000 * 60 * 60;
    var _MS_PER_MINUTE = 1000 * 60;
    var _MS_PER_SECOND = 1000;

    // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds());

    var ret = {};

    ret.days = Math.floor((utc2 - utc1) / _MS_PER_DAY);
    ret.hours = Math.floor((utc2 - utc1) / _MS_PER_HOUR) - (ret.days * 24);
    ret.minutes = Math.floor((utc2 - utc1) / _MS_PER_MINUTE) - (ret.days * 1440) - (ret.hours * 60);
    ret.seconds = Math.floor((utc2 - utc1) / _MS_PER_SECOND) - (ret.days * 86400) - (ret.hours * 3600) - (ret.minutes * 60);

    if(!opt) { opt = {}; }

    var options = {
      now: ((opt.now) ? opt.now : 'Just now'),
      withinHour: ((opt.withinHour) ? opt.withinHour : '%mm ago'),
      withinDay: ((opt.withinDay) ? opt.withinDay : '%hh ago'),
      yesterday: ((opt.yesterday) ? opt.yesterday : 'Yesterday'),
      withinMonth: ((opt.withinMonth) ? opt.withinMonth : '%dd ago')
    };

    if(!fancyReturn) {
      return ret;
    }

    if(ret.days === 0 && ret.hours === 0 && ret.minutes === 0) {
      return options.now.replace('%s', ret.seconds);
    }
    else if(ret.days === 0 && ret.hours === 0 && ret.minutes >= 1) {
      return options.withinHour.replace('%s', ret.seconds).replace('%m', ret.minutes);
    }
    else if(ret.days === 0 && ret.hours >= 1) {
      return options.withinDay.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
    }
    else if(ret.days === 1) {
      return options.yesterday.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
    }
    else {
      if(ret.days > 30 && Math.floor(ret.days / 30) < 12) {
        return Math.floor(ret.days / 30) + ' months ago';
      } else if(ret.days > 30 && Math.floor(ret.days / 30) >= 12) {
        return Math.floor( Math.floor(ret.days / 30) / 12 ) + ' years ago';
      } else {
        return options.withinMonth.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours).replace('%d', ret.days);
      }
    }
  };

  $rootScope.notify = function(content, options) {
    if(options === undefined) {
      options = {};
    }

    return new jBox('Notice', {
      content: content,
      autoClose: 5000,
      animation: {open: 'flip', close: 'flip'},
      color: (options.color || 'black'),
      audio: ((options.sound===true)?'/sounds/bling2':'')
    });
  };
});