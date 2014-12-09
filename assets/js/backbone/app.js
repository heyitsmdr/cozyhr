var cozyApp = Marionette.Application.extend({
  initialize: function() {

  }
});

var cozyRouter = Marionette.AppRouter.extend({
  appRoutes: {
    'signin': 'routeSignin'
  }
});

CozyHR.App = new cozyApp({ container: '#mainContainer' });

CozyHR.App.on('start', function() {
  CozyHR.AppRouter = new cozyRouter();

  CozyHR.AppRouter.appRoute('signin',' signin');

  Backbone.history.start();
  console.log('App started');
});

CozyHR.App.routeSignin = function() {
  console.log('asd');
}

$(document).ready(function() {
  CozyHR.App.start();
});