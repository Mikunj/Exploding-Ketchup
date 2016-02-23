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

var $ = require('./constants');

/**
 * A set of cards played by the player.
 * @param {Object} player The owner of the set
 * @param {Array} cards  An array of cards in the set
 */
var CardSet = function(player, cards) {
    
    /**
     * Generate a random id
     * @returns {String}   A random id
     */
    this.generateRandomID = function() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    //The set id
    this.id = this.generateRandomID();
    
    //The owner of the set
    this.owner = player;
    
    //The cards in the set
    this.cards = cards;
    
    //The effects of the card has been played
    this.effectPlayed = false;
    
    //If a nope was played on this card set
    this.nopePlayed = false;
    
    //Number of nopes played on this set
    this.nopeAmount = 0;

}

/**
 * Whether the set is has no cards
 * @returns {Boolean} True if set has no cards else false
 */
CardSet.prototype.isEmpty = function() {
    return (this.cards.length < 1);
}

/**
 * Get the index of a card in the set by id
 * @param   {String} id Card id
 * @returns {Number} The index of the card or -1 if not found
 */
CardSet.prototype.cardIndexById = function(id) {
    for (var key in this.cards) {
        var card = this.cards[key];
        if (card.id === id) return key;
    }
    return -1;
}

/**
 * Whether the card set has a card with given id
 * @param   {String} id The card id
 * @returns {Boolean}  True if the set has the card else false
 */
CardSet.prototype.hasCardWithId = function(id) {
    return this.cardIndexById(id) >= 0;
}

/**
 * Whether the card set has a card of a certain type
 * @param   {String}  type The card type
 * @returns {Boolean} True if the set has the card else false
 */
CardSet.prototype.hasCardType = function(type) {
    for (var key in this.cards) {
        var card = this.cards[key];
        if (card.type === type) return true;
    }
    return false;
}

/**
 * Remove a card type from the set
 * @param   {String}   type The card type
 * @returns {Object} The card or null
 */
CardSet.prototype.removeCardType = function(type) {
    if (this.hasCardType(type)) {
        var chosenCard = null;
        for (var key in this.cards) {
            var card = this.cards[key];
            if (card.type === type) {
                chosenCard = card;
                break;
            }
        }
        
        if (chosenCard) {
            this.cards.splice(this.cards.indexOf(chosenCard), 1);
        }
        
        return chosenCard;
    }
    return null;
}

/**
 * Remove a card with given id from the cards
 * @param   {String} id The card id
 * @returns {Object} The card or null
 */
CardSet.prototype.removeCardWithId = function(id) {
    var index = this.cardIndexById(id);
    return (index >= 0) ? this.cards.splice(index, 1)[0] : null;
}

/**
 * Whether the current card set can be used to steal.
 * E.g Blind steal, Named steal or Discard steal.
 * 
 * @returns {String} The type of steal the card set can do.
 */
CardSet.prototype.canSteal = function() {
    switch (this.cards.length) {
        case 2:
            //Player needs to have matching cards
            return (this.cardsMatching()) ? $.CARDSET.STEAL.BLIND : $.CARDSET.STEAL.INVALID;
            break;
        case 3:
            //Player needs to have matching cards
            return (this.cardsMatching()) ? $.CARDSET.STEAL.NAMED : $.CARDSET.STEAL.INVALID;
            break;
        case 5:
            //Player needs to have different cards
            return (this.cardsDifferent()) ? $.CARDSET.STEAL.DISCARD : $.CARDSET.STEAL.INVALID;
            break;
        default:
            return $.CARDSET.STEAL.INVALID;
    }
    return $.CARDSET.STEAL.INVALID;
}

/**
 * Whether the cards in the set are all matching
 * @returns {Boolean} True if all cards are matching else false
 */
CardSet.prototype.cardsMatching = function() {
    if (this.cards.length > 0) {
        //Easiest way to check if to get the first card and match it against the rest
        //Cards match if their types are same and the image displayed is the same
        var card = this.cards[0];
        for (var i = 1; i < this.cards.length; i++) {
            var compareCard = this.cards[i];
            var match = card.name === compareCard.name && card.type === compareCard.type;
            if (!match) return false;
        }
                
        return true;
    }
    return false;
}

/**
 * Whether the cards in the set are all different
 * @returns {Boolean} True if all cards are different else false
 */
CardSet.prototype.cardsDifferent = function() {
    if (this.cards.length > 1) {
        //O(n^2) method as we have to compare each card to another
        for (var i = 0; i < this.cards.length - 1; i ++) {
            var card = this.cards[i];
            for (var j = i + 1; j < this.cards.length; j++) {
                var compareCard = this.cards[j];
                var match = card.name === compareCard.name && card.type === compareCard.type;
                if (match) return false;
            }
        }
        
        return true;
    }
    
    //If we just have 1 card then obviously it's different from the rest
    return this.cards.length == 1;
}

module.exports = CardSet;