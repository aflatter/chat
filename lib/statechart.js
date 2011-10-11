require('sproutcore-statechart');
require('chat/core');

// Helper function to bind a socket event to a statechart action.
var bindSocket = function(event, action) {
  var socket = Chat.get('socket');
  socket.on(event, function() {
    Chat.statechart.sendAction(action, this, arguments);
  });
}

Chat.Statechart = SC.Statechart.extend({
  trace: YES,

  initialState: 'loading',

  loading: SC.State.extend({

    initialSubstate: 'register',

    enterState: function() {
      this.initSocket();
    },
    initSocket: function() {
      var socket = io.connect();
      Chat.set('socket', socket);

      bindSocket('vanish',  'didReceiveVanish');
      bindSocket('emerge',  'didReceiveEmerge');
      bindSocket('join',    'didReceiveJoin');
      bindSocket('leave',   'didReceiveLeave');
      bindSocket('message', 'didReceiveMessage');
    },
    register: SC.State.extend({
      enterState: function() {
        Chat.get('socket').emit('hello', function(data) {
          Chat.statechart.sendAction('didRegister', this, data);
        });
      },
      didRegister: function(ctx, data) {
        var user  = Chat.store.find(Chat.User, data.profile.id),
            lobby = Chat.store.find(Chat.Room, data.lobby);

        Chat.set('users', Chat.store.find(Chat.User));
        Chat.set('user',  user);

        // Load received users into the store.
        Chat.store.loadRecords(Chat.User, data.users);
        // Load profile of this user.
        Chat.store.loadRecord(Chat.User, data.profile);

        Chat.set('lobby', lobby);

        this.gotoState('joinLobby');
      }
    }),
    joinLobby: SC.State.extend({
      enterState: function() {
        var id = Chat.getPath('lobby.id');
        Chat.get('socket').emit('join', id, function(data) {
          Chat.statechart.sendAction('didJoinLobby', this, data);
        });
      },
      didJoinLobby: function(ctx, data) {
        // Push room information into the store.
        Chat.store.loadRecord(Chat.Room, data);
        // Set the lobby.
        Chat.set('room', Chat.get('lobby'));
        // Finally ready to chat. :)
        this.gotoState('ready');
      }
    })
  }),

  ready: SC.State.extend({
    enterState: function() {
    },
    sendMessage: function(sender, payload) {
      var room   = Chat.get('room');
      var data   = {room: room.get('id'), payload: payload};
      var socket = Chat.get('socket');

      socket.emit('message', data, function(response) {});
    },
    didReceiveJoin: function(ctx, args) {
      var roomId = args[0], userId = args[1];
      console.debug('join', roomId, userId);
      var store = Chat.get('store'),
          room  = store.find(Chat.Room, roomId),
          user  = store.find(Chat.User, userId);

      room.get('users').pushObject(user);
    },
    didReceiveLeave: function(ctx, args) {
      var roomId = args[0], userId = args[1];
      console.debug('leave', roomId, userId);
      var store = Chat.get('store'),
          room  = store.find(Chat.Room, roomId),
          user  = store.find(Chat.User, userId);
     
      room.get('users').removeObject(user);
    },
    didReceiveMessage: function(ctx, args) {
      var data    = args[0],
          store   = Chat.get('store'),
          room    = store.find(Chat.Room, data.room),
          message = Chat.Message.create(data),
          userId  = Chat.getPath('user.id'),
          roomIds = Chat.getPath('user.rooms').getEach('id');

      console.debug('message', data);

      data.payload.forEach(function(part) {
        if (typeof part == 'object' && part.type == 'user') {
          // Someone mentioned this user.
          if (part.id == userId) {
            console.log('MENTION!');

            // Check if user is already a member of this room.
            if (roomIds.indexOf(data.room) == -1) {
              console.log('not a member');
            } else {
              console.log('IM A MEMBER');
            }
          }
        }
      });

      room.get('messages').pushObject(message);
    },
    // A user connected to the server.
    didReceiveEmerge: function(ctx, args) {
      var data  = args[0],
          store = Chat.get('store');
      console.log('emerge', data)
      store.loadRecord(Chat.User, data);
    },
    // A user disconnected from the server.
    didReceiveVanish: function(ctx, args) {
      var data  = args[0],
          store = Chat.get('store');
      console.log('vanish', data);
      store.pushDestroy(Chat.User, data);
    }
  })

});

Chat.statechart = Chat.Statechart.create();
