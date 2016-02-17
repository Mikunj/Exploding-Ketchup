/**
 * A playing card
 * @param {String} name The name
 * @param {String} type The card type
 * @param {String} image The image
 */
var Card = function(name, type, image) {
    
    //Card name to display
    this.name = name;
    
    //Card type
    this.type = type;
    
    //Card icon
    this.image = image;
    
}

module.exports = Card;
