// Backbone Routing
var appRouter = Backbone.Router.extend({
  routes: {
    'signin': 'signin'
  }
});

CozyHR.Router = new appRouter();

CozyHR.Router.on('route:signin', function(actions) {
  CozyHR.CurrentView = new CozyHR.Views.SigninView();
});

$(document).ready(function() {
  // Fire up the router
  Backbone.history.start();
});