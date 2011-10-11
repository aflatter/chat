var Statechart = Chat.Statechart,
    statechart, preserve;

module('Statechart', {
  setup: function() {
    statechart = Statechart.create();
    preserve = {io: window.io}
  },
  teardown: function() {
    if (statechart && statechart.get('statechartIsInitialized')) {
      statechart.destroy();
    }
    window.io = preserve.io;
  }
});

test('its initialState is "loading"', function() {
  equals(statechart.get('initialState'), 'loading');
});

test('its loading state has initSocket', function() {
  var eventNames = [];

  var socket = { on: function(name, handler) { eventNames.push(name); } };
  window.io  = { connect: function() { return socket; } };

  statechart.get('loading').create().initSocket();

  equals(Chat.get('socket'), socket);
  deepEqual(eventNames, ["vanish", "emerge","join", "leave", "message"]);
});
