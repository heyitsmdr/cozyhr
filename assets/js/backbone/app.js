// Main app
var cozyApp = Marionette.Application.extend({
  initialize: function() {

  }
});

// Router Controller
var cozyRouterCtl = Marionette.Controller.extend({
  signin: function() {
    CozyHR.CurrentView = new CozyHR.Views.AuthSigninView();
  }
});

cozyRouterCtl = new cozyRouterCtl();

// Router
var cozyRouter = Marionette.AppRouter.extend({
  controller: cozyRouterCtl,
  appRoutes: {
    'signin': 'signin'
  }
});

// App initialization
CozyHR.App = new cozyApp({ container: '#mainContainer' });

CozyHR.App.on('start', function() {
  console.log('App started');

  CozyHR.AppRouter = new cozyRouter();

  Backbone.history.start();
});

CozyHR.App.routeSignin = function() {
  console.log('asd');
}

$(document).ready(function() {
  CozyHR.App.start();
});