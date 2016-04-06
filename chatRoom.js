function Room (name, creator, priv, password) {
    this.name = name;
    this.creator = creator;
    this.members[0] = creator;
    this.isPrivate = priv;
    this.password = password;
}
 
Room.prototype = {
    getName: function() {
        return this.name;
    },
    getCreator: function() {
        return this.creator;
    },
    
    isPrivate: function(){
        return this.isPrivate;
    },
    
    getPassword: function() {
        return this.password;
    },
    
    getMembers: function() {
        return this.members;
    },
    
    addMember: function(memberName) {
		this.members[this.members.length] = memberName;
	},
    
    isMember: function(memberName) {
        for(m in this.members) {
            if (m == memberName) {
                return true;
            }
        }
        return false;
    },
    
    removeMember: function(memberName) {
        var temp = []
        for (var i = 0; i < this.members.length; i++){
            if (this.members[i] != this.memberName) {
                temp[i] = this.members[i];
            }
        }
        this.members = temp;
    },
    
    sendMessage: function(user, msg) {
        var msgToSend = user + ": " + msg;
        socketio.emit("message_to_server", {message:msgToSend});
    }
};



