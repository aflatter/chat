var view;

module('MessageView', {
  setup: function() {
  },
  teardown: function() {
    if (view) view.destroy();
  }
});

test('property "readableCreatedAt" formats "createdAt"', function() {
  var now     = new Date(),
      message = SC.Object.create({createdAt: now.toJSON()}),

  view = Chat.MessageView.create({content: message});
  equals(view.get('readableCreatedAt'), now.strftime("%H:%M:%S"));
});

test('property "readablePayload" formats "payload"', function() {
  var payload = ['hello', {type: 'user', id: 1, text: 'world'}],
      message = SC.Object.create({payload: payload});

  view = Chat.MessageView.create({content: message});

  equals(view.get('readablePayload'), 'hello world');
});
