require('sproutcore-datastore');
require('chat/models');

var bind = Util.bind,
    socket;

Chat.DataSource = SC.DataSource.extend({
  // TODO: Declaring socketBinding as 'Chat.socket' has no effect.
  //       Figure out why.
  socket: function() {
    return Chat.get('socket');
  }.property('Chat.socket').cacheable(),

  retrieveRecord: function(store, storeKey, id) {
    var socket     = this.get('socket'),
        recordType = store.recordTypeFor(storeKey),
        eventName;

    switch(recordType) {
      case Chat.Room:
        eventName = 'room';
        break;
      case Chat.User:
        eventName = 'user';
        break;
      default:
        return NO;
    }

    socket.emit(eventName, id, function(data) {
      if (data) store.loadRecord(recordType, data);
      else store.dataSourceDidError(storeKey, 'not found');
    });

    return YES;
  }
});
