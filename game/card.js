/**
 * A playing card
 * @param {String} name The name
 * @param {String} type The card type
 * @param {String} icon The icon
 */
var Card = function(name, type, icon) {
    
    //Card name to display
    this.name = name;
    
    //Card type
    this.type = type;
    
    //Card icon
    this.icon = icon;
    
    //Card effect has been played
    this.effectPlayed = false;
}

module.exports = Card;
