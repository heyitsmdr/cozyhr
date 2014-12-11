// Main app
var cozyApp = Marionette.Application.extend({});

// Router Controller
var cozyRouterCtl = Marionette.Controller.extend({
  signin: function() {
    CozyHR.App.mainContainer.empty();
    CozyHR.App.mainContainer.show( new CozyHR.Views.AuthSigninView() );
  },

  signingin: function() {
    CozyHR.App.mainContainer.empty();
    CozyHR.App.mainContainer.show( new CozyHR.Views.AuthMessageView({ message: 'Signing you in, one moment...' }) );
  }
});

cozyRouterCtl = new cozyRouterCtl();

// Router
var cozyRouter = Marionette.AppRouter.extend({
  controller: cozyRouterCtl,
  appRoutes: {
    'signin'    : 'signin',
    'signing-in': 'signingin'
  }
});

// App initialization
CozyHR.App = new cozyApp({ container: '#mainContainer' });

CozyHR.App.on('start', function() {
  console.log('App started');

  CozyHR.App.addRegions({
    header: '#header',
    mainContainer: '#mainContainer',
    footer: '#footer'
  });

  CozyHR.AppRouter = new cozyRouter();

  Backbone.history.start();
});

CozyHR.App.routeSignin = function() {
  console.log('asd');
}

$(document).ready(function() {
  CozyHR.App.start();
});