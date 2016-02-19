//class for main game
var EK = function() {

    //List of users
    this.users = {};

    //List of games
    this.games = {};

    //Current user id
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
    
    //Get the current user
    this.getCurrentUser = function() {
        if (this.currentUser) {
            return this.users[this.currentUser];
        }
        return null;
    }
    
    //Get the current game user is in
    this.getCurrentUserGame = function() {
        if (this.currentUser) {
            var user = this.getCurrentUser();
            if (user.currentGame) {
                return this.games[user.currentGame];
            }
        }
        return null;
    }
};

//class for local user
var User = function(id, nickname) {
    
    //The user id
    this.id = id;
    
    //The name of the user
    this.name = nickname;
    
    //Current game id user is in
    this.currentGame = null;
    
};

//class for current game
var Game = function(id, title, status, players, index) {
    //Game id
    this.id = id;

    //Game title
    this.title = title;

    //Game status. WAITING or PLAYING.
    this.status = status;

    //Array of connected players
    this.players = players;
    
    //Current player index
    this.currentIndex = index;
    
    //Get a player in the game
    this.getPlayer = function(user) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user === user) return player;
        }

        return null;
    }
    
    //Update a player in the game if they exist
    this.updatePlayer = function(data) {
        var cPlayer = null;
        if (data) {
            for (var i = 0; i < this.players.length; i++) {
                var player = this.players[i];
                if (player.user.id === data.user.id) {
                    cPlayer = player;
                    break;
                };
            }

            if (cPlayer) {
                cPlayer.user = data.user;
                cPlayer.alive = data.alive;
                cPlayer.ready = data.ready;
                cPlayer.drawAmount = data.drawAmount
            }
        }
    }
    
    //Get the current host
    this.getHost = function() {
        return (this.players.length > 0) ? this.players[0].user : null;
    }
    
    //Check whether user is the host
    this.isGameHost = function(user) {
        var host = this.getHost();
        return (host && host.id === user.id);
    }
}

var Player = function(user, alive, ready, drawAmount) {
    //The user associated with the player
    this.user = user;
    
    //The current score
    this.alive = alive;
    
    //The amount of cards player has to draw
    this.drawAmount = drawAmount;
    
    //Set the player to ready
    this.ready = ready;
    
    //Set the status
    this.status = function() {
        return (this.ready) ? $C.GAME.PLAYER.STATUS.READY : $C.GAME.PLAYER.STATUS.NOTREADY;
    }
    
    //The color corresponding to the status
    this.statusColor = function() {
        var status = this.status();
        switch (status) {
            case $C.GAME.PLAYER.STATUS.NOTREADY:
                return "red";
            case $C.GAME.PLAYER.STATUS.READY:
                return "green";
            default:
                return "red";
        }
    }
}