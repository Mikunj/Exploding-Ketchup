var User = function(id, nickname) {

    //User id
    this.id = id;
    
    //User name
    this.name = nickname;
    
    //Current room user is in
    this.currentRoom = null;
}

module.exports = User;