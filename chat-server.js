// Require the packages we will use:
var http = require("http"),
	socketio = require("socket.io"),
	fs = require("fs");
 
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html:
var app = http.createServer(function(req, resp){
	// This callback runs when a new connection is made to our HTTP server.
 
	fs.readFile("index.html", function(err, data){
		// This callback runs when the client.html file has been read from the filesystem.
 
		if(err) return resp.writeHead(500);
		resp.writeHead(200);
		resp.end(data);
	});
});
app.listen(3456);

function Room (name, creator, id, priv, password) {
	this.name = name;
	this.creator = creator;
	this.id = id;
	this.members = [];
	
	this.isPrivate = priv;
	this.password = password;
}

Room.prototype = {
	
	addMember: function(memberName) {
		this.members[this.members.length] = memberName;
	},
	
	removeMember: function(memberName) {
		var personIndex = -1;
		for(var i = 0; i < this.people.length; i++){
			if(this.people[i].id === person.id){
				personIndex = i;
				break;
			}
		}
		this.people.remove(personIndex);
	},
	
	isMember: function(memberName) {
		for(m in this.members) {
			if (m == memberName) {
				return true;
			}
		}
		return false;
	}
}

function Person (name, roomOwn, roomIn) {
	this.name = name;
	this.owns= roomOwn;
	this.inRoom = roomIn;
}

 
// Do the Socket.IO magic:
var io = socketio.listen(app);
var rooms = {};
var users = {};
var sockets = [];

io.sockets.on("connection", function(socket){
	// This callback runs when a new Socket.IO connection is established.
	
	socket.on("new_user", function(data){
		users[socket.id] = new Person(data['name'], null, null);
		sockets[socket.id] = socket;
	})
	
	socket.on("create_room", function(data) {
		if (users[socket.id].inRoom != null) {
			socket.emit("update", "You are in a room. Please leave it first to create your own.");
		} else if (users[socket.id].owns == null) {
			var id = uuid.v4();
			var room = new Room(data['name'], data['creator'], id, data['priv'], data['pass']);
			rooms[id] = room;
			io.sockets.emit("roomList", {rooms: rooms});
			//add room to socket, and auto join the creator of the room
			socket.join(data['name']);
			users[socket.id].owns = id;
			users[socket.id].inroom = id;
			room.addMember(users[socket.id]);
			socket.emit("update", "Welcome to " + room.name + ".");
			socket.emit("sendRoomID", {id: id});
			chatHistory[socket.room] = [];
		} else {
			socket.emit("update", "You have already created a room.");
		}
	});
	
	socket.on("join_room", function(data){
		users[socket.id].inRoom = data.room.id;
		socket.join(data.room);
		
	});
 
	socket.on('message_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
 
		console.log(data["user"] + ": " + data["message"]); // log it to the Node.JS output
		io.sockets.emit("message_to_client", {user: data["user"], message:data["message"]}) // broadcast the message to other users
		});
});
