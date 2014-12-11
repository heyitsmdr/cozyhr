var messageModel = Backbone.Model.extend();

CozyHR.Views.AuthMessageView = Marionette.LayoutView.extend({
  template: CozyHR.JST('auth/signin'),
  messageTemplate: _.template('<div class="intro-nocompany"><%- message %></div>'),
  className: 'bb-AuthMessageView',

  initialize: function(o) {
    this.model = new messageModel(o);
  },

  render: function() {
    this.$el.html( this.template() );

    this.$('#authFormWrapper').html( this.messageTemplate({ message: this.model.get('message') }) );

    this.$('#authFormWrapper').fadeIn();

    this.$('#logo').fadeIn();
  }
});