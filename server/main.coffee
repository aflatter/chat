http      = require('http')
Static    = require('node-static').Server
socketIO  = require('socket.io')

# For development in combination with bpm preview:
# HttpProxy = require('http-proxy').HttpProxy
#
# proxy = new HttpProxy
#   target: 
#     host: 'localhost'
#     port: 4020

static = new Static('./assets')

server = http.createServer (req, res) ->
  req.addListener 'end', -> static.serve(req,res)
  # Development: proxy.proxyRequest(req, res)

io  = socketIO.listen(server)
app = server.listen(4021)

Store =
  Room:
    count: 1
    all: {}
  User:
    count: 1
    all: {}

class Model
  @get: (id) ->
    Store[@name].all[id]

  constructor: (opts) ->
    this[key] = val for key, val of opts

    @store = Store[@constructor.name]
    @id = @store.count++
    @store.all[@id] = this

  destroy: ->
    delete @store.all[@id]

class Room extends Model
  constructor: (opts) ->
    super

    @users = {}

  addUser: (user) ->
    @users[user.id] = user

  removeUser: (user) ->
    delete @users[user.id]

  toJSON: ->
    id: @id
    topic: @topic
    users: (userId for userId of @users)

class User extends Model
  constructor: (opts) ->
    super

    @name ?= "User #{@id}"
    @rooms = {}

  addRoom: (room) ->
    @rooms[room.id] = room

  removeRoom: (room) ->
    delete @rooms[room.id]

  toJSON: ->
    id:   @id
    name: @name
    rooms: (roomId for roomId of @rooms)

lobby = new Room topic: "Lobby"

io.sockets.on 'connection', (socket) -> 
  new Connection(socket)

class Connection

  constructor: (@socket) ->
    @socket.on 'hello',      @hello
    @socket.on 'disconnect', @disconnect

  # Client wants to register with the server.
  hello: (fn) =>
    # Welcome the user with a profile.
    @user = new User socket: @socket

    # Remember the user id.
    @socket.set 'user.id', @user.id, =>
      response = {}

      response.profile = @user
      response.lobby   = lobby.id
      response.users   = (value.toJSON() for key, value of Store.User.all)

      fn response

      # Notify all connected users.
      @socket.broadcast.emit 'emerge', @user.toJSON()

      # Now that the user is registered, grant him access to more data.
      @socket.on 'join',    @join
      @socket.on 'leave',   @leave
      @socket.on 'room',    @roomInfo
      @socket.on 'user',    @userInfo
      @socket.on 'message', @message

  # User joins room.
  join: (id, callback) =>
    room = Room.get(id)

    return callback(null) unless room?

    @broadcastRoom(room, 'join', room.id, @user.id)
    room.addUser(@user)
    @user.addRoom(room)

    callback room.toJSON()

  # User leaves room.
  leave: (id) =>
    room = Room.get(id)

    return callback(null) unless room?

    @broadcastRoom(room, 'leave', room.id, @user.id)
    room.removeUser(@user)
    @user.removeRoom(room)

  # Returns information about a room.
  roomInfo: (id, callback) =>
    callback Room.get(id)?.toJSON()

  # Returns information about a user.
  userInfo: (id, callback) =>
    callback User.get(id)?.toJSON()

  broadcastRoom: (room, args...) =>
    for userId, user of room.users
      user.socket.emit(args...)

  disconnect: =>
    return unless @user?

    # Leave all rooms.
    @leave(roomId) for roomId of @user.rooms
    # Notify all users.
    @socket.broadcast.emit 'vanish', @user.id
    # Remove user from registry.
    @user.destroy()

  message: (data, callback) =>
    room = Room.get(data?.room)
    return callback(false) unless room

    data.createdAt = new Date()
    data.author    = @user.name

    for part in data.payload when typeof part == 'object'
      # Notify users who are not in the room if they are mentioned.
      if part.type is 'user' and not room.users[part.id]
        User.get(part.id)?.socket.emit('message', data)

    @broadcastRoom(room, 'message', data)
    callback(true)
