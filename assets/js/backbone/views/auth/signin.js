CozyHR.Views.AuthSigninView = Marionette.LayoutView.extend({
  el: '#mainContainer',
  template: CozyHR.JST('auth/signin'),

  regions: {
    form: '#pageSignin'
  },

  initialize: function() {
    this.render();

    this.form.show(new CozyHR.Views.AuthFormView({
      title: 'CozyHR',
      submitText: 'Press enter to sign in.',
      fields: [{
        type: 'text',
        id: 'email',
        placeholder: 'Company Email'
      },
      {
        type: 'password',
        id: 'password',
        placeholder: 'Password'
      }]
    }));
  },

  render: function() {
    this.$el.html( this.template({ }) );

    // fade the form in
    $('#pageSignin').fadeIn();

    // drop the logo in
    $('#logo').hide().toggle('drop', { direction: 'up' });
  }

});