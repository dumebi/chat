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
 
// Do the Socket.IO magic:
var io = socketio.listen(app);
var rooms = [];
var usernames = [];
io.sockets.on("connection", function(socket){
	// This callback runs when a new Socket.IO connection is established.
	
	socket.on("new_user", function(data){
		for (r in rooms){
			io.sockets.emit("room_list", {user: data['user'], room: r});
		}
	})
	
	socket.on("add_room", function(roomName) {
		//console.log(data["user"] + ": " + data["message"]); // log it to the Node.JS output
		//rooms[rooms.length] = data['room'];
		rooms[roomName]=roomName;
		console.log("Added Room: "+ roomName);
		io.sockets.emit("add_room", roomName) // broadcast the message to other users
	});
	
	socket.on("add_user", function(username){
		socket.username = username;
		usernames[username] = username;
		
	});
 
	socket.on('message_to_server', function(data) {
		// This callback runs when the server receives a new message from the client.
 
		console.log(data["user"] + ": " + data["message"]); // log it to the Node.JS output
		io.sockets.emit("message_to_client", {user: data["user"], message:data["message"]}) // broadcast the message to other users
		});
});
