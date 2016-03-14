/**
  Exloding Ketchup. 
  A Exploding Kittens clone without kittens.
  Copyright (C) 2016  Mikunj Varsani

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
*/

//class for main game
var EK = function() {

    //List of users
    this.users = {};

    //List of games
    this.games = {};

    //Current user id
    this.currentUser = null;
    
    //Current hand
    this.gameData = new GameData();

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

var GameData = function() {
    //The hand
    this.hand = [];
    
    //The discard pile
    this.discardPile = [];
    
    //The current played set
    this.currentPlayedSet = null;
    
    //Whether we are in a favor or not
    this.favor = {
        from: null, //The player who asked us
        to: null //The player we asked
    };
    
    /**
     * Check if the hand contains a certain card type
     * @param   {String} type The card type
     * @returns {Boolean}  Whether the hand has it
     */
    this.hasCardTypeInHand = function(type) {
        for (var key in this.hand) {
            var card = this.hand[key];
            if (card.type === type) return true;
        }
        return false;
    }
    
    /**
     * Get the card with given id from hand
     * @param   {String} id The card id
     * @returns {Object} The card object or null
     */
    this.getCardFromHand = function(id) {
        for (var key in this.hand) {
            var card = this.hand[key];
            if (card.id === id) return card;
        }
        
        return null;
    }
    
    /**
     * Get the current discard pile without explode
     * @returns {Array} An array of cards
     */
    this.getDiscardPileWithoutExplode = function() {
        var pile = [];
            for (var key in this.discardPile) {
                var card = this.discardPile[key];
                if (card.type != $C.CARD.EXPLODE) {
                    pile.push(card);
                }
            }
        return pile;
    }
    
    /**
     * Whether the cards passed are all matching
     * @param   {Array} cards An array of cards
     * @returns {Boolean} True if all cards are matching else false
     */
    this.cardsMatching = function(cards) {
        if (cards.length > 0) {
            //Easiest way to check if to get the first card and match it against the rest
            //Cards match if their types are same and the image displayed is the same
            var card = cards[0];
            for (var i = 1; i < cards.length; i++) {
                var compareCard = cards[i];
                var match = card.name === compareCard.name && card.type === compareCard.type;
                if (!match) return false;
            }

            return true;
        }
        return false;
    }

    /**
     * Whether the cards passed are all different
     * @param   {Array} cards An array of cards
     * @returns {Boolean} True if all cards are different else false
     */
    this.cardsDifferent = function(cards) {
        if (cards.length > 1) {
            //O(n^2) method as we have to compare each card to another
            for (var i = 0; i < cards.length - 1; i ++) {
                var card = cards[i];
                for (var j = i + 1; j < cards.length; j++) {
                    var compareCard = cards[j];
                    var match = card.name === compareCard.name && card.type === compareCard.type;
                    if (match) return false;
                }
            }
            
            return true;
        }

        //If we just have 1 card then obviously it's different from the rest
        return cards.length == 1;
    }
}

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
var Game = function(id, title, status, players, index, drawPileLength, nopeTime) {
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
    
    //The amount of cards left in the draw pile
    this.drawPileLength = drawPileLength;
    
    //The amount of time to nope a card in milliseconds
    this.nopeTime = nopeTime;
    
    //Get a player in the game
    this.getPlayer = function(user) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user === user.id) return player;
        }

        return null;
    }
    
    //Update a player in the game if they exist
    this.updatePlayer = function(data) {
        var cPlayer = null;
        if (data) {
            for (var i = 0; i < this.players.length; i++) {
                var player = this.players[i];
                if (player.user === data.user.id) {
                    cPlayer = player;
                    break;
                };
            }

            if (cPlayer) {
                cPlayer.user = data.user.id;
                cPlayer.alive = data.alive;
                cPlayer.ready = data.ready;
                cPlayer.drawAmount = data.drawAmount;
                cPlayer.cardCount = data.cardCount;
            }
        }
    }
    
    //Get the current host
    this.getHost = function() {
        return (this.players.length > 0) ? this.players[0] : null;
    }
    
    //Check whether user is the host
    this.isGameHost = function(user) {
        var host = this.getHost();
        return (host && host.user === user.id);
    }
    
    /**
     * Get the current player who's turn it is
     * @returns {Object} The current player or null
     */
    this.getCurrentPlayer = function() {
        if (this.players.length > 0) {
            if (this.players[this.currentIndex]) {
                return this.players[this.currentIndex];
            }
        }
        
        return null;
    }
    
    /**
     * Check if game can be started
     * @returns {Boolean} Whether game can be started
     */
    this.canStart = function() {
        if (this.status === $C.GAME.STATUS.WAITING) {
            for (var key in this.players) {
                var player = this.players[key];
                if (!player.ready) return false;
            }
            return true;
        }
        return false;
    }
}

var Player = function(userId, alive, ready, drawAmount, cardCount) {
    //The user associated with the player
    this.user = userId;
    
    //The current score
    this.alive = alive;
    
    //The amount of cards player has to draw
    this.drawAmount = drawAmount;
    
    //Amount of cards player has
    this.cardCount = cardCount;
    
    //Set the player to ready
    this.ready = ready;
    
    //Set the status
    this.status = function(game) {
        var status = $C.GAME.PLAYER.STATUS;
        if (!this.alive) return status.DEAD;
        
        if (game.status === $C.GAME.STATUS.WAITING) {            
            return (this.ready) ? status.READY : status.NOTREADY;
        } else if (game.status === $C.GAME.STATUS.PLAYING) {
            //Check if we are the current player
            var currentPlayer = game.getCurrentPlayer();
            return (currentPlayer && currentPlayer.user === this.user) ? status.PLAYING : status.WAITING;
        }
        
        return status.NOTREADY;
    }
    
    //The color corresponding to the status
    this.statusColor = function(game) {
        var status = this.status(game);
        switch (status) {
            case $C.GAME.PLAYER.STATUS.NOTREADY:
                return "red";
            case $C.GAME.PLAYER.STATUS.READY:
            case $C.GAME.PLAYER.STATUS.PLAYING:
                return "green";
            case $C.GAME.PLAYER.STATUS.WAITING:
                return "blue";
            
            default:
                return "red";
        }
    }
}