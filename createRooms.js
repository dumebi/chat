$(document).ready(function() {
	
	var socketio = io.connect();
	socketio.on("message_to_client",function(data) {
	   //Append an HR thematic break and the escaped HTML of the new message
	   document.getElementById("chatlog").appendChild(document.createElement("hr"));
	   document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
	});
	
	var user;
	var rooms = [];
	var activeRoom;
	
	$("#newChat").click(function(){
		var roomName = $('#roomName').val();
		var isPrivate = $('#private').value();
		var pass = $('#pass').value();
		activeRoom = new Room(roomName, user, isPrivate, pass);
		rooms[rooms.length] = room;
	});
	
	$("#leaveChat").click(function(){
		activeRoom.removeMember(user);
		activeRoom = null;
		
	});
	
	$("#enterRoom").click(function(){
		var roomName = $('#room').val();
		var index = $('#index').val();
		var pass = $('#pass').val();
		activeRoom = rooms[index];
		if (activeRoom.isPrivate()) {
            if (activeRoom.getPassword==pass) {
                activeRoom.addMember(user);
            } else {
				alert("Invalid Password! Entry Denied");
			}
        } else {
			activeRoom.addMember(user);
		}
	});
	
	$("#send").click(function(){
		if (activeRoom != null) {
            activeRoom.sendMessage(user, msg);
        }
	});
	
	$("#DM").click(function(){
		if (activeRoom != null) {
            activeRoom.sendMessage(user, msg);
        }
	});
});