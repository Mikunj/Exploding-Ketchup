/**
 * A player instance for a given user for a specific game
 * @param {Object} user The user
 */
var Player = function(user) {
    
    //The user associated with the player
    this.user = user;
    
    //The current score
    this.alive = true;
    
    //Players hand
    this.hand = [];
    
    //The amount of cards player has to draw
    this.drawAmount = 1;
    
    //Set the player to ready
    this.ready = false;
    
};

/**
 * Reset the player
 */
Player.prototype.reset = function() {
    this.hand = [];
    this.alive = true;
    this.ready = false;
    this.drawAmount = 1;
};

/**
 * Get the index of the given card in players hand
 * @param   {Object} card The card
 * @returns {Number} The position of the card in players hand
 */
Player.prototype.cardIndex = function(card) {
    for (var i = 0; i < this.hand.length; i++) {
        if (card === this.hand[i])
            return i;
    }

    return -1;
}

/**
 * Get the first index of the given card type in players hand
 * @param   {String} type Card type
 * @returns {Number} The position of the first card type in players hand
 */
Player.prototype.cardTypeIndex = function(type) {
    for (var i = 0; i < this.hand.length; i++) {
        if (type === this.hand[i].type)
            return i;
    }
    
    return -1;
}

/**
 * Check if a player has a certain card
 * @param   {Object} card The card
 * @returns {Boolean} Whether the player has the card
 */
Player.prototype.hasCard = function(card) {
    return (this.cardIndex(card) > 0);
}

/**
 * Check if a player has a certain card type
 * @param   {String}   type The card type
 * @returns {Boolean} Whether the player has the card
 */
Player.prototype.hasCardType = function(type) {
    return (this.cardTypeIndex(type) > 0);
}

/**
 * Add a card to the players hand
 * @param {Object} card The card
 */
Player.prototype.addCard = function(card) {
    this.hand.push(card);
}

/**
 * Add cards to the players hand
 * @param {Array} cards An array of cards
 */
Player.prototype.addCards = function(cards) {
    for (var card in cards) {
        this.addCard(card);
    }
}

/**
 * Remove card from players hand
 * @param   {Object} card The card to remove
 * @returns {Object} The removed card or null.
 */
Player.prototype.removeCard = function(card) {
    var index = this.cardIndex(card);
    return (index > 0) ? this.hand.splice(index, 1)[0] : null;
}

/**
 * Remove the first card type from players hand
 * @param   {String} type Card type
 * @returns {Object} The removed card or null
 */
Player.prototype.removeCardType = function(type) {
    var index = this.cardTypeIndex(type);
    return (index > 0) ? this.hand.splice(index, 1)[0] : null;
}

module.exports = Player;