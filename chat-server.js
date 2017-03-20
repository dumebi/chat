// Require the packages we will use:
var http = require("http"),
	socketio = require("socket.io"),
	fs = require("fs"),
    _ = require('underscore')._,
	uuid = require("uuid");
 
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
app.listen(3457);

function Room (name, creator, id, priv, password) {
	this.name = name;
	this.creator = creator;
	this.id = id;
	this.members = {};
	
	this.isPrivate = priv;
	this.password = password;

	this.addMember = function(member) {
		this.members[member.id] = member;
	};
	
	this.removeMember = function(member) {
		delete(this.members[member]);
	};
	
	this.isMember = function(memberName) {
		for(m in this.members) {
			if (m == memberName) {
				return true;
			}
		}
		return false;
	};
}

function Person (name, id, roomOwn, roomIn) {
	this.name = name;
	this.id = id;
	this.owns = roomOwn;
	this.inRoom = roomIn;
}

 
// Do the Socket.IO magic:
var io = socketio.listen(app);
var rooms = {};
var users = {};
var sockets = [];
var chatHistory = {};


io.sockets.on("connection", function(socket){
	// This callback runs when a new Socket.IO connection is established.
	
	socket.on("new_user_to_server", function(data){
		var person = data;
		person.id = socket.id;
		users[socket.id] = person;
		sockets[socket.id] = socket;
		socket.emit("new_user_to_client", person);
		if (Object.keys(rooms).length != 0) {
			socket.emit("room_list", rooms);
		}
	})
	
	socket.on("create_room_to_server", function(data) {
		var roomId = uuid.v4();
		var userId = data['creator'];
		var room = new Room(data['name'], userId, roomId, data['isPrivate'], data['password']);
		rooms[roomId] = room;
		//add room to socket, and auto join the creator of the room
		socket.join(roomId);
		users[userId].owns = roomId;
		users[userId].inRoom = roomId;

        chatHistory[roomId] = [];

		room.addMember(users[userId]);
		io.sockets.emit('create_room_to_client', room);
	});
	
	socket.on("enter_room_to_server", function(data) {
		var roomId = data.inRoom;
		users[data.id].inRoom = roomId;
		socket.join(data.inRoom);
		rooms[roomId].addMember(users[data.id]);
		io.sockets.in(data.inRoom).emit("enter_room_to_client", data.name + " has joined!");

        var keys = _.keys(chatHistory);
        if (_.contains(keys, users[data.id].inRoom)) {
            io.sockets.emit("history", chatHistory[users[data.id].inRoom]);
        }
	});
	
	socket.on("leave_room_to_server", function(data) {
		var user = data['user'];
		var newRoom = data['id'];
		var oldRoom = user.inRoom;
		users[user.id].inRoom = newRoom;
		socket.leave(oldRoom);
		io.sockets.in(oldRoom).emit("leave_room_to_client", user.name + " has left!");
		rooms[oldRoom].removeMember(users[user.id]);
	});
	
	socket.on("list_mems_to_server", function(data) {
		socket.emit("list_mems_to_client", rooms[data].members);
	});

	socket.on('message_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
		var user = data['user'];
		//console.log("user in room "+user.inRoom);
		console.log(user.name + ": " + data["message"]); // log it to the Node.JS output

        chatHistory[user.inRoom].push("<strong>" + user.name + "</strong>: " + data['message']);
		io.sockets.in(user.inRoom).emit("message_to_client", {user: user.name, message:data["message"]}) // broadcast the message to other users

	});
	
	socket.on('send_pic_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
		var user = data['user'];
		io.sockets.in(user.inRoom).emit("send_pic_to_client", {user: user.name, pic:data["pic"]}) // broadcast the message to other users
	});

	
	socket.on('dm_message_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
		var fromMem = data['fromMem'];
		var toMem = data['toMem'];
		console.log("Direct Message from " + fromMem.name + " to " + toMem.name + ": " + data["message"]); // log it to the Node.JS output
		io.sockets.to(toMem.id).emit("dm_message_to_client", {fromMem:fromMem, toMem:toMem, message:data["message"]}) // broadcast the message to other users
		io.sockets.to(fromMem.id).emit("dm_message_to_client", {fromMem:fromMem, toMem:toMem, message:data["message"]}) // broadcast the message to other users
	});
	
	socket.on('kick_mem_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
		var fromMem = data['fromMem'];
		var toMem = data['toMem'];
		var room = fromMem.inRoom;
		users[toMem.id].inRoom = null;
		sockets[toMem.id].leave(room);
		io.sockets.in(room).emit("kick_mem_to_client", toMem.name + " has been kicked out!");
		io.sockets.to(toMem.id).emit("kicked_mem_to_client", "You have been kicked out!");
		rooms[room].removeMember(users[toMem.id].id);
		console.log(rooms[room]);
	});
	
	socket.on('ban_mem_to_server', function(data) {
		var fromMem = data['fromMem'];
		var toMem = data['toMem'];
		var room = fromMem.inRoom;
		users[toMem.id].inRoom = null;
		sockets[toMem.id].leave(room);
		io.sockets.in(room).emit("ban_mem_to_client", toMem.name + " has been banned!");
		io.sockets.to(toMem.id).emit("banned_mem_to_client", {room:room, message:"You have been banned!"});
		rooms[room].removeMember(users[toMem.id]);
		console.log(room);
	});
	
});
