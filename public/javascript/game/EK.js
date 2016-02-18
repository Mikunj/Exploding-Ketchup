//class for main game
var EK = function() {

    //List of users
    this.users = {};

    //List of games
    this.games = {};

    //Current user
    this.currentUser = null;

    this.addUser = function(user) {
        this.users[user.id] = user;
    }
    
    this.removeUser = function(id) {
        if (this.users[id]) {
            delete this.users[id];
        }
    }
    
    this.addGame = function(game) {
        this.games[game.id] = game;
    }
    
    this.removeGame = function(id) {
        if (this.games[id]) {
            delete this.games[id];
        }
    }

};

//class for local user
var User = function(id, nickname) {
    
    //The user id
    this.id = id;
    
    //The name of the user
    this.name = nickname;
    
    //Current game user is in
    this.currentGame = null;
    
};

//class for current game
var Game = function(id, title, status, players) {
    //Game id
    this.id = id;

    //Game title
    this.title = title;

    //Game status. WAITING or PLAYING.
    this.status = status;

    //Array of connected players
    this.players = players;
    
    //Get a player in the game
    this.getPlayer = function(user) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user === user) return player;
        }

        return null;
    }
}

var Player = function(user, alive, ready) {
    //The user associated with the player
    this.user = user;
    
    //The current score
    this.alive = alive;
    
    //Players hand
    this.hand = [];
    
    //The amount of cards player has to draw
    this.drawAmount = 1;
    
    //Set the player to ready
    this.ready = ready;
    
    //Set the status
    this.status = (ready) ? $C.GAME.PLAYER.STATUS.READY : $C.GAME.PLAYER.STATUS.NOTREADY;
    
    //The color corresponding to the status
    this.statusColor = function() {
        return "red";
    }
}