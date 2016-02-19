var Player = require('./player');
var $ = require('./constants');
var Card = require('./card');

/**
 * A game on the server
 * @param {Object} id  The game id
 * @param {String} title The game title
 */
var Game = function(id, title) {

    //Game id
    this.id = id;

    //Game title
    this.title = title;

    //Game status. WAITING or PLAYING.
    this.status = $.GAME.STATUS.WAITING;

    //Array of connected players
    this.players = [];
    
    //Cards in the draw pile
    this.drawPile = [];

    //Cards in the discard pile
    this.discardPile = [];

    //Index of the current user playing
    this.cUserIndex = 0;

    //Min players to start the game
    this.minPlayers = 2;

    //*************** Settings *******************

    //Amount of players allowed in game
    this.maxPlayers = 8;
    
};

/**
 * Return a sanitized version of the game
 * @returns {Object} A sanitized version of the game
 */
Game.prototype.sanitize = function() {
    return {
        id: this.id,
        title: this.title,
        status: this.status,
        players: this.getPlayers(),
        currentPlayerIndex: this.cUserIndex
    }
}

/**
 * Add a player to the game
 * @param   {Object} user A user
 * @returns {Boolean}  Whether adding a player is successful
 */
Game.prototype.addPlayer = function (user) {
    var connected = this.isPlayerConnected(user);

    if (this.players.length + 1 > this.maxPlayers || connected)
        return false;

    if (!connected)
        this.players.push(new Player(user));

    return true;
}

/**
 * Remove a player from the game
 * @param {Object} user A user
 */
Game.prototype.removePlayer = function (user) {
    var index = this.playerIndexForUser(user);
    if (index >= 0)
        this.players.splice(index, 1);
}

/**
 * Get a sanitized version of game players.
 * This makes sure you don't send hand data to the others
 * @returns {Array} An array of players
 */
Game.prototype.getPlayers = function() {
    var players = [];
    for (var key in this.players) {
        var player = this.players[key];
        players.push({
            user: player.user,
            ready: player.ready,
            alive: player.alive,
            drawAmount: player.drawAmount
        });
    }
    
    return players;
}

/**
 * Get a player for the associated user
 * @param   {Object} user The user
 * @returns {Object} Returns player or null
 */
Game.prototype.getPlayer = function(user) {
    var index = this.playerIndexForUser(user);
    return (index >= 0) ? this.players[index] : null;
}

/**
 * The current game host.
 * It is always the first person in the array
 * @returns {Object} Returns a user or null
 */
Game.prototype.gameHost = function() {
    return (this.players.length > 0) ? this.players[0].user : null;
}

/**
 * The player index for a given user in connected player array.
 * @param   {Object} user The user
 * @returns {Number} Returns index if found else -1
 */
Game.prototype.playerIndexForUser = function (user) {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player.user === user)
            return i;
    }

    return -1;
}

/**
 * Check whether a player is connected to the game
 * @param   {Object} user The user associated with the player
 * @returns {Boolean} Whether player is connected
 */
Game.prototype.isPlayerConnected = function (user) {
    return (this.playerIndexForUser(user) >= 0);
}

/**
 * Generate a random id
 * @returns {String}   A random id
 */
Game.prototype.generateRandomID = function() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Start the game.
 *
 * @returns {Boolean} If game started
 */
Game.prototype.start = function () {
    //Check if we can start/have already started
    if (this.players.length < this.minPlayers || this.status === $.GAME.STATUS.PLAYING)
        return false;
    
    //Only start if all the players are ready
    for (var key in this.players) {
        var player = this.players[key];
        if (!player.ready) return false;
    }

    //We call a reset incase
    this.reset();
    this.status = $.GAME.STATUS.PLAYING;
    
    //Give each player a diffuse and 4 random card from the pile
    for (var key in this.players) {
        var player = this.players[key];
        player.addCard(new Card(this.generateRandomID(), 'Defuse', $.CARD.DEFUSE, 'a'));
        this.drawCards(player, 4);
    }
    
    //Add in bombs
    for (var i = 0; i < this.players.length - 1; i ++) {
        this.drawPile.push(new Card(this.generateRandomID(), 'Explode', $.CARD.EXPLODE, 0));
    }
    
    this.shuffleDeck();
    
    return true;
}

/**
 * Stop the game
 * @returns {Boolean} If game stopped
 */
Game.prototype.stop = function() {
    if ((this.playerAliveCount() < 2 || this.players.length < this.minPlayers) && this.status === $.GAME.STATUS.PLAYING) {
        this.reset();
        this.status = $.GAME.STATUS.WAITING;
        return true;
    }
    return false;
}

/**
 * Count the amount of players alive
 * @returns {Number} Amount of players alive
 */
Game.prototype.playerAliveCount = function() {
    var count = 0;
    for (var key in this.players) {
        var player = this.players[key];
        if (player.alive) {
            count += 1;
        }
    }
    
    return count;
}

/**
 * Increment a given index
 * @param {Number} index The index to increment
 */
Game.prototype.increment = function(index) {
    if (index + 1 >= this.players.length) {
        index = 0;
    } else {
        index += 1;
    }
}

/**
 * Get the index of the next alive player
 * @param   {Number} start The start index
 * @returns {Number} The index of the next player
 */
Game.prototype.getNextAliveIndex = function(start) {
    var next = start;
    this.increment(next);
    
    //Go to the next alive player
    while(this.playerAliveCount() > 1 && !this.players[next].alive) {
        this.increment(next);
    }
    
    return next;
}

/**
 * Get the next alive player
 * @param   {Number} start The start index
 * @returns {Object} The next alive player
 */
Game.prototype.getNextAlive = function(start) {
    return this.players[this.getNextAliveIndex(start)];
}

/**
 * Get player for the current user index
 * @returns {Object} The player
 */
Game.prototype.playerForCurrentIndex = function() {
    return this.players[this.cUserIndex];
}

/**
 * Draw cards from the pile and adds it to the players hand
 * @param   {Object} player The player
 * @param   {Number} amount Amount of cards to draw
 * @returns {Array}  An array of cards drawn
 */
Game.prototype.drawCards = function(player, amount) {
    
    if (amount > 0) {
        var cards = this.drawPile.splice(0, amount);
        player.addCards(cards);
        return cards;
    }
    
    return [];
}

/**
 * Explode a player
 * @param {Object} player The player
 */
Game.prototype.explodePlayer = function(player) {
    player.alive = false;
    
    //Add the hand to the discard pile
    for (var key in player.hand) {
        var card = player.hand[key];
        var set = new CardSet(player, [card]);
        this.discardPile.push(set);
    }
    player.hand = [];
}

/**
 * Reset the game
 */
Game.prototype.reset = function (){
    this.status = $.GAME.STATUS.WAITING;
    this.drawPile = [];
    this.discardPile = [];
    this.cUserIndex = 0;

    //Reset players
    for (var key in this.players) {
        var player = this.players[key];
        player.reset();
    }
    
    //Reset deck
    this.resetDeck();
    this.shuffleDeck();
}

/**
 * Reset the deck
 * Note: This doesn't add defuse and explode cards
 */
Game.prototype.resetDeck = function() {
    /*
    A deck consists of:
    8 Attack cards
    8 Skip cards
    8 Favor cards
    8 Shuffle cards
    10 Future cards
    8 x 5 Regular cards
    */
    
    this.drawPile = [];
    
    //Generate cards
    for (var i = 0; i < 10; i++) {
        if (i < 8) {
            this.drawPile.push(new Card(this.generateRandomID(), 'Attack', $.CARD.ATTACK, 0));
            this.drawPile.push(new Card(this.generateRandomID(), 'Skip', $.CARD.SKIP, 1));
            this.drawPile.push(new Card(this.generateRandomID(), 'Favor', $.CARD.FAVOR, 2));
            this.drawPile.push(new Card(this.generateRandomID(), 'Shuffle', $.CARD.SHUFFLE, 3));
            
            //5 regular cards
            for (var j = 0; j < 5; j++) {
                this.drawPile.push(new Card(this.generateRandomID(), 'Regular_' + i, $.CARD.REGULAR, j));
            }
        }
        
        this.drawPile.push(new Card(this.generateRandomID(), 'Future', $.CARD.FUTURE, 4));
    }
    
}

/**
 * Shuffle the deck of cards
 * @returns {Object} The shuffled deck
 */
Game.prototype.shuffleDeck = function() {
  for (var i = this.drawPile.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this.drawPile[i];
        this.drawPile[i] = this.drawPile[j];
        this.drawPile[j] = temp;
    }
    return this.drawPile;
}

/**
 * Toggle the ready state of a user
 * @param   {Object} user The user
 * @returns {Boolean} Whether the user is ready
 */
Game.prototype.toggleReady = function(user) {
    var player = this.getPlayer(user);
    if (player) {
        player.ready = !player.ready;
        return player.ready;
    }
    
    return false;
}

/**
 * Check whether we can start a game
 * @returns {Boolean} Whether we can start a game
 */
Game.prototype.canStart = function() {
    if (this.players.length >= this.minPlayers) {
        //Make sure everyone is ready
        for (var key in this.players) {
            var player = this.players[key];
            if (!player.ready) return false;
        }
        
        return true;
    }
    
    return false;
}

/**
 * Get the discard pile of cards
 * @returns {Array} An array of cards in the discard pile
 */
Game.prototype.getDiscardPile = function() {
    var pile = [];
    //We have to iterate backwards from the pile so that the recently played cards are at the top
    for(var i = this.discardPile.length - 1; i >= 0; i--) {
        var cards = this.discardPile[i].cards;
        pile = pile.concat(cards);
    }
    
    return pile;
}

module.exports = Game;