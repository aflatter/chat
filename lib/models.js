require('chat/core');

Chat.User = SC.Record.extend({
  primaryKey: 'id',
  name:       SC.Record.attr(String),

  rooms: function() {
    return this.get('store').find(SC.Query.local(Chat.Room, {
      conditions: 'users CONTAINS %@', parameters: [this]
    }));
   }.property().cacheable()
});

Chat.Room = SC.Record.extend({
  primaryKey: 'id',
  topic:      SC.Record.attr(String),
  users:      SC.Record.toMany('Chat.User', {inverse: 'rooms'}),
  messages:   null,

  init: function() {
    this.set('messages', []);
    this._super();
  }
});

Chat.Message = SC.Object.extend({
  author:    null,
  payload:   null,
  createdAt: null
});

