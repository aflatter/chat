var dataSource, originalSocket;

module('DataSource', {
  setup: function() {
    dataSource     = Chat.DataSource.create();
    originalSocket = Chat.get('socket');
  },
  teardown: function() {
    dataSource.destroy();
    Chat.set('socket', originalSocket);
  }
});

test('retrieveRecord', function() {
  expect(6);
  stop(500);

  var store = SC.Object.create({
    recordTypeFor: function(storeKey) {
      equals(storeKey, 1);
      return Chat.User;
    },
    loadRecord: function(recordType, dataHash) {
      equals(recordType, Chat.User);
      deepEqual(dataHash, {name: 'foo'});
      start();
    }
  });

  Chat.set('socket', SC.Object.create({
    emit: function(event, id, callback) {
      equals(event, 'user');
      equals(id,    2);
      callback({name: 'foo'});
    }
  }));

  SC.run(function() {
    var ret = dataSource.retrieveRecord(store, 1, 2);
    equals(ret, YES);
  });
});
