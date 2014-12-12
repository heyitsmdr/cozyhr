var formFieldModel = Backbone.Model.extend({
  defaults: {
    type: '',
    id: '',
    placeholder: '',
    validationType: '',
    allowBlank: false,
    value: ''
  },

  validate: function() {
    // Blank?
    if(this.get('value').length === 0 && this.get('allowBlank') === false) {
      return false;
    }

    // Email Validation
    if(this.get('validationType') === 'email' && (this.get('value').indexOf('@') === -1 || this.get('value').indexOf('.') === -1)) {
      return false;
    }

    return true;
  }
});

var formFieldCollection = Backbone.Collection.extend({
  model: formFieldModel
});

var fieldView = Marionette.ItemView.extend({
  initialize: function(o) {
    this.model = o.model;
  },

  events: {
    'keyup' : 'onKeyUp'
  },

  onBeforeRender: function() {
    this.template = _.template('<input type="<%- type %>" id="<%- id %>" placeholder="<%- placeholder %>">', this.model.attributes);
  },

  onKeyUp: function(evt) {
    // update value on model
    this.model.set('value', evt.target.value);

    if(evt.keyCode === 13) {
      this.trigger('try:submit');
    }
  }
});

var fieldCollectionView = Marionette.CollectionView.extend({
  childView: fieldView,

  initialize: function() {
    this.collection = new formFieldCollection;
  },

  childEvents: {
    'try:submit': function() {
      var formValidated = this.collection.map(function(_field) {
        return _field.validate();
      });

      if(formValidated.indexOf(false) === -1) {
        this.trigger('do:submit');
      }
    }
  }
});

var formModel = Backbone.Model.extend({
  defaults: {
    title: 'Blank Form',
    submitText: 'Press enter to submit the form',
    submitTextClass: '',
    fields: [],
    fieldCollection: false,
    postTo: ''
  },

  initialize: function() {
    this.setFields();

    this.listenTo(this.get('fieldCollection'), 'do:submit', function() {
      // Bubble this up
      this.trigger('do:submit');
    }.bind(this));
  },

  setFields: function() {
    this.get('fields').forEach(function(field) {
      var newField = new formFieldModel(field);
      this.get('fieldCollection').collection.add(newField);
    }.bind(this));
  },

  getFieldsAsJSON: function() {
    return JSON.stringify(this.get('fieldCollection').collection);
  },

  getSubmitData: function() {
    var submitObj = {};
    this.get('fieldCollection').collection.each(function(field) {
      submitObj[ field.get('id') ] = field.get('value');
    });
    return submitObj;
  }
});

CozyHR.Views.AuthFormView = Backbone.View.extend({
  template: CozyHR.JST('auth/form'),

  initialize: function(o) {
    this.fieldCollectionView = new fieldCollectionView();
    o.fieldCollection = this.fieldCollectionView;
    this.model = new formModel(o);

    this.listenTo(this.fieldCollectionView, 'do:submit', this.submit);
    this.listenTo(this.model, 'change:submitText', this.onSubmitTextChange);
  },

  addField: function(o) {
    this.model.get('fields').push(o);
  },

  render: function() {
    this.$el.html( this.template({
      title: this.model.get('title'),
      submitText: this.model.get('submitText')
    }) );
    this.$('.login-form').html(this.fieldCollectionView.render().el);
  },

  submit: CozyHR.debounce(function() {
    console.log(this.model.getSubmitData());
    $.post(this.model.get('postTo'), this.model.getSubmitData(), function(data) {
      if(data.success) {
        document.location = '/#/signing-in';
      } else {
        this.model.set({ submitText: data.error, submitTextClass: 'alert' });
      }
    }.bind(this));
  }),

  onSubmitTextChange: function() {
    this.$('.press-enter').fadeOut(100, function() {
      this.$('.press-enter').removeClass(this.model.get('submitTextClass')).addClass(this.model.get('submitTextClass')).html(this.model.get('submitText')).fadeIn(150);
    }.bind(this));
  }
});