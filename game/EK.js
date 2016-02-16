var User = require('./user');
var Game = require('./game');
var $ = require('./constants');

var EK = function(io) {
    
    //List of all the current users
    this.connectedUsers = {};
    
    //List of all the current games
    this.gameList = {};
}

/**
 * Check if a user with the given name is connected
 * @param   {String}  nickname The name
 * @returns {Boolean} Given name is connected
 */
EK.prototype.isUserWithNameConnected = function(nickname) {
    var connected = false;
    
    for(var key in this.connectedUsers) {
        var user = this.connectedUsers[key];
        if (user.name === nickname) {
            connected = true;
            break;
        }
    }
        
    return connected;
}

/**
 * Add a user to the connected users
 * @param {Object} user The user
 */
EK.prototype.addUser = function(user) {
    if (!(user.id in this.connectedUsers)) {
        this.connectedUsers[user.id] = user;
    }
}

/**
 * Remove a user from connected users
 * @param {Object} user The user
 */
EK.prototype.removeUser = function(user) {
    if (user.id in this.connectedUsers) {
        delete this.connectedUsers[user.id];
    }
}

/**
 * Add a game to the game list
 * @param {Object} game The game
 */
EK.prototype.addGame = function(game) {
    if (!(game.id in this.gameList)) {
        this.gameList[game.id] = game;
    }
}

/**
 * Remove a game from the game list
 * @param {Object} game The game
 */
EK.prototype.removeGame = function(game) {
    if (game.id in this.gameList) {
        delete this.gameList[game.id];
    }
}

/**
 * Generate a random id
 * @returns {String}   A random id
 */
EK.prototype.generateRandomID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = EK;