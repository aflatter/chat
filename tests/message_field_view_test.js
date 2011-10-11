var view;

module('MessageFieldView', {
  setup: function() {
  },
  teardown: function() {
    if (view) view.destroy();
  }
});

test('isEditable by default', function() {
  view = Chat.MessageFieldView.create();
  equals(view.get('isEditable'), YES);
});

test('observes isEditable and sets attribute', function() {
  expect(2);

  view = Chat.MessageFieldView.create();

  SC.run(function() { view.append(); });
  equals(view.$().attr('contenteditable'), 'true');

  SC.run(function() { view.set('isEditable', NO); });
  equals(view.$().attr('contenteditable'), 'false');
});

test('its classNames includes "message-field-view"', function() {
  view = Chat.MessageFieldView.create();
  ok(view.get('classNames').indexOf('message-field-view') > 0);
});

test('its buildMarkupForMenuItem returns the correct HTML', function() {
  view = Chat.MessageFieldView.create();

  var el = $(view.buildMarkupForMenuItem({label: 'foo', value: 'bar'}));

  equals(el.attr('data-id'), 'bar');
  equals(el.attr('contenteditable'), 'false');
  equals(el.text(), 'foo');
});

test('suggests all contacts when text ends with an "@"', function() {
  view = Chat.MessageFieldView.create();
  contacts = [SC.Object.create({name: 'foo'}), SC.Object.create({name: 'bar'})];
  view.set('contacts', contacts);
  view.suggest(view, {term: '@'}, function(res) {
    deepEqual(res, ['foo','bar']);
  });
});
