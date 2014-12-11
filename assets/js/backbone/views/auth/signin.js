var companyModel = Backbone.Model.extend({
  urlRoot: '/'
  name: ''
});

CozyHR.Views.AuthSigninView = Marionette.LayoutView.extend({
  template: CozyHR.JST('auth/signin'),

  className: 'bb-AuthSigninView',

  regions: {
    form: '#authFormWrapper'
  },

  initialize: function() {
    this.model = new companyModel();
    this.model.fetch();

    this.authFormView = new CozyHR.Views.AuthFormView({
      title: 'CozyHR',
      submitText: 'Press enter to sign in.',
      postTo: '/auth/attemptLogin',
      fields: [
        {
          type: 'text',
          id: 'email',
          placeholder: 'Company Email',
          validationType: 'email'
        },
        {
          type: 'password',
          id: 'password',
          placeholder: 'Password',
          validationType: 'password'
        }
      ]
    });
  },

  render: function() {
    this.$el.html( this.template({ }) );

    this.form.show(this.authFormView);

    this.$('#authFormWrapper').fadeIn();

    this.$('#logo').fadeIn();
  },

  onDestroy: function() {
    this.authFormView = null;
  }

});