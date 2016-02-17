/**
 * A set of cards played by the player.
 * @param {Object} player The owner of the set
 * @param {Array} cards  An array of cards in the set
 */
var CardSet = function(player, cards) {
    
    //The owner of the set
    this.owner = player;
    
    //The cards in the set
    this.cards = cards;
    
    //The effects of the card has been played
    this.effectPlayed = false;
}

/**
 * Whether the set is has no cards
 * @returns {Boolean} True if set has no cards else false
 */
CardSet.prototype.isEmpty = function() {
    return (this.cards.length < 1);
}

/**
 * Whether the card set has a card with given id
 * @param   {String} id The card id
 * @returns {Boolean}  True if the set has the card else false
 */
CardSet.prototype.hasCardWithId = function(id) {
    for (var card in this.cards) {
        if (card.id === id) return true;
    }
    return false;
}

/**
 * Whether the card set has a card of a certain type
 * @param   {String}  type The card type
 * @returns {Boolean} True if the set has the card else false
 */
CardSet.prototype.hasCardType = function(type) {
    for (var card in this.cards) {
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
        for (var card in this.cards) {
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
            var match = card.type === compareCard.type && card.image === compareCard.image;
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
                var match = card.type === compareCard.type && card.image === compareCard.image;
                if (match) return false;
            }
        }
    }
    
    //If we just have 1 card then obviously it's different from the rest
    return this.cards.length == 1;
}

module.exports = CardSet;