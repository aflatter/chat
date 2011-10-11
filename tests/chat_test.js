var originalStatechart;

StatechartMock = {
  called: 0,
  initStatechart: function() { this.called++ }
}

module('Chat', {
  setup: function() {
    originalStatechart = Chat.statechart;
    Chat.statechart    = StatechartMock;
  },
  teardown: function() {
    Chat.statechart = originalStatechart;
  }
});

test('main initializes statechart', function() {
  Chat.main();
  equals(StatechartMock.called, 1);
});

