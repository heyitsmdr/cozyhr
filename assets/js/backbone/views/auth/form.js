var formFieldModel = Backbone.Model.extend({
  defaults: {
    type: '',
    id: '',
    placeholder: ''
  }
});

var formFieldCollection = Backbone.Collection.extend({
  model: formFieldModel
});

var fieldView = Marionette.ItemView.extend({
  initialize: function(o) {
    this.model = o.model;
  },

  onBeforeRender: function() {
    this.template = _.template('<input type="<%- type %>" id="<%- id %>" placeholder="<%- placeholder %>">', this.model.attributes);
  }
});

var fieldCollectionView = Marionette.CollectionView.extend({
  childView: fieldView,

  initialize: function() {
    this.collection = new formFieldCollection;
  }
});

CozyHR.Views.AuthFormView = Backbone.View.extend({
  template: CozyHR.JST('auth/form'),

  initialize: function(o) {
    this.fieldCollectionView = new fieldCollectionView();

    this.title = o.title || 'Blank Form';
    this.submitText = o.submitText || 'Press enter to submit the form.';

    o.fields.forEach(function(field) {
      this.addField(field);
    }.bind(this));
  },

  addField: function(o) {
    var newField = new formFieldModel(o);
    this.fieldCollectionView.collection.add(newField);
  },

  render: function() {
    this.$el.html( this.template({
      title: this.title,
      submitText: this.submitText
    }) );
    this.$('.login-form').html(this.fieldCollectionView.render().el);
  }
});