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
 * @param   {Object} id The card id
 * @returns {Number} The position of the card in players hand
 */
Player.prototype.cardIndexById = function(id) {
    for (var i = 0; i < this.hand.length; i++) {
        if (this.hand[i].id === id)
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
        if (this.hand[i].type === type)
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
    return (this.cardIndex(card) >= 0);
}

/**
 * Check if a player has a certain card with given id
 * @param   {Object} id The card id
 * @returns {Boolean} Whether the player has the card
 */
Player.prototype.hasCardWithId = function(id) {
    return (this.cardIndexById(id) >= 0);
}

/**
 * Check if a player has cards with given ids
 * @param   {Array} ids An array of card ids
 * @returns {Boolean}  Whether the player has the cards
 */
Player.prototype.hasCardsWithId = function(ids) {
    for (var key in ids) {
        var id = ids[key];
        if (!this.hasCardWithId(id)) return false;
    }
    
    return true;
}

/**
 * Check if a player has a certain card type
 * @param   {String}   type The card type
 * @returns {Boolean} Whether the player has the card
 */
Player.prototype.hasCardType = function(type) {
    return (this.cardTypeIndex(type) >= 0);
}

/**
 * Get cards from the players hands with given id
 * @param   {Array} ids An array of card ids
 * @returns {Array} An array of cards
 */
Player.prototype.getCardsWithId = function(ids) {
    var cards = [];
    for (var key in ids) {
        var id = ids[key];
        var cardIndex = this.cardIndexById(id);
        if (cardIndex >= 0) {
            cards.push(this.hand[cardIndex]);
        }
    }
    return cards;
}

/**
 * Get a random card from the players hand
 * @returns {Object} A random card or null
 */
Player.prototype.getRandomCard = function() {
    if (this.hand.length > 0) {
        var randomInt = Math.floor(Math.random() * (this.hand.length - 1));
        return this.hand[randomInt];
    }
    
    return null;
}

/**
 * Get a card of a certain type
 * @param   {Object} type [[Description]]
 * @returns {Object} The card of type or null
 */
Player.prototype.getCardType = function(type) {
    var index = this.cardTypeIndex(type);
    return (index >= 0) ? this.hand[index] : null;
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
    for (var key in cards) {
        var card = cards[key];
        this.addCard(card);
    }
}

/**
 * Remove card from players hand
 * @param   {Object} card The card to remove
 * @returns {Object} The removed card or null.
 */
Player.prototype.removeCard = function(card) {
    return this.removeCardWithId(card.id);
}

/**
 * Remove cards from the players hand
 * @param {Array} cards An array of cards to remove
 */
Player.prototype.removeCards = function(cards) {
    for (var key in cards) {
        this.removeCard(cards[key]);
    }
}

/**
 * Remove card from players hand with given id
 * @param   {Object} id The card with id to remove
 * @returns {Object} The removed card or null.
 */
Player.prototype.removeCardWithId = function(id) {
    var index = this.cardIndexById(id);
    return (index >= 0) ? this.hand.splice(index, 1)[0] : null;
}

/**
 * Remove cards from the players hands with given id
 * @param   {Array} ids An array of card ids
 * @returns {Array} An array of removed cards
 */
Player.prototype.removeCardsWithId = function(ids) {
    var cards = [];
    for (var key in ids) {
        var id = ids[key];
        cards.push(this.removeCardWithId(id));
    }
    return cards;
}

/**
 * Remove the first card type from players hand
 * @param   {String} type Card type
 * @returns {Object} The removed card or null
 */
Player.prototype.removeCardType = function(type) {
    var index = this.cardTypeIndex(type);
    return (index >= 0) ? this.hand.splice(index, 1)[0] : null;
}

module.exports = Player;