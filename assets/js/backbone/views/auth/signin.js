CozyHR.Views.AuthSigninView = Backbone.Marionette.LayoutView.extend({
  el: '#mainContainer',
  template: CozyHR.JST('auth/signin'),

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html( 'hey' );
  }

});