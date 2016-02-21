var Login = {
    
    /**
     * Show an error on the login page
     * @param {String} error The error
     */
    showError: function(error) {
        $('#login .error').text(error);
        $('#login .error').fadeIn("slow");
    },
    
    show: function() {
        $('#login').show();
    },
    
    hide: function() {
        $('#login').hide();
    }
};

var Lobby = {
    
    show: function() {
        $('#lobby').show();
    },
    
    hide: function() {
        $('#lobby').hide();
    },
    
    /**
     * Update the user list display
     */
    updateUserList: function(EK) {
        //Clear users
        $('#userList .content').empty();
        
        //Add user to the list
        $.each(EK.users, function(id, user) {
            var html = "<div class='user' data-id='" + user.id + "'>" + user.name + "</div>";

            //Check that we don't double up on adding users
            if ($("#userList .content .user[data-id='" + user.id + "']").length < 1) {
                $('#userList .content').append(html);
            }
        });
        
        //Set the user count
        $('#userList .top-bar').text('Connected Users ( ' + Object.keys(EK.users).length + ' )');
    
    },
    
    /**
     * Update the game list display
     */
    updateGameList: function(EK) {
        //Clear games
        $('#gameList .content').empty();
        
        //Add games to the list
        $.each(EK.games, function(id, game) {
            var disabledString = (game.status == $C.GAME.STATUS.PLAYING) ? 'disabled' : '';
            var html = "<div class='game' data-id='" + game.id + "'>" +
                            "<div id='top'>" +
                                "<div id='title'>" + game.title + "</div>" +
                                "<div id='status'>" + game.status + "</div>" +
                                "<div id='players'>Players: " + game.players.length + "</div>" +
                            "</div>" +
                            "<div id='bottom'>" +
                                "<button id='joinGameButton' data-id='" + game.id + "' class='btn btn-success btn-block" + disabledString + 
                                "' type='button'>Join</button>" +
                            "</div>" +
                        "</div>";
            
            
            //Check that we don't double up on adding games
            if ($(".game[data-id='" + game.id + "']").length < 1) {
                $('#gameList .content').append(html);
                
            }
            
        });
        
    }
    
};

var GameRoom = {
    
    /**
     * Update the room
     * @param {Object} EK The main game instance
     */
    update: function(EK) {
        this.updateCardDisplay(EK);
        this.updateInputDisplay(EK);
        this.updatePlayerList(EK);
        this.updateGameOverlay(EK);
    },
    
    /**
     * Update the start, ready, play and end turn buttons
     * @param {Object} EK The main game instance
     */
    updateInputDisplay: function(EK) {
        var user = EK.getCurrentUser();
        var game = EK.getCurrentUserGame();
        if (user && game) {
            var waitingInput = $('#waitingInput');
            var playingInput = $('#playingInput');
            var startButton = $('#startGameButton');
            var readyButton = $('#readyGameButton');
            var playButton = $('#playGameButton');
            var drawButton = $('#drawGameButton');
            if (game.status === $C.GAME.STATUS.WAITING) {
                waitingInput.show();
                playingInput.hide();
                
                //Show and hide the buttons
                if (game.isGameHost(user)) {
                    startButton.show();
                    readyButton.hide();
                } else {
                    startButton.hide();
                    readyButton.show();
                    
                    //Toggle the display of the ready game button
                    var player = game.getPlayer(user);
                    var text = (player.ready) ? "Un-Ready" : "Ready";
                    readyButton.text(text);
                }
                
            } else if (game.status == $C.GAME.STATUS.PLAYING) {
                waitingInput.hide();
                playingInput.show();
                
                if (game.getCurrentPlayer().user === user.id) {
                    playButton.show();
                    drawButton.show();

                    if ($("#playingInput .card[data-selected='true']").length < 1) {
                        drawButton.show();
                        playButton.hide();
                    } else {
                        playButton.show();
                        drawButton.hide();
                    }
                    
                    if (this.shouldEnablePlayButton(EK)) {
                        playButton.removeClass('disabled');
                    } else {
                        playButton.addClass('disabled');
                    }
                } else {
                    playButton.hide();
                    drawButton.hide();
                }

            }
        }
    },
    
    /**
     * Update all cards in current game.
     * All cards get auto deselected.
     * @param {Object} EK The main game instance
     */
    updateCardDisplay: function(EK) {
        //Update current playing card display
        this.updateCardsForElement(EK.gameData.hand, $('#playingInput #cardDisplay'));
        
        //Update give popup card display
        this.updateCardsForElement(EK.gameData.hand, $('#givePopup #cardDisplay'));
        
        //Update discard popup card display
        this.updateCardsForElement(EK.gameData.getDiscardPileWithoutExplode(), $('#discardStealPopup #cardDisplay'));
        
        //Update named popup card display
        $('#namedStealPopup #cardDisplay').empty();
        $.each($C.CARD, function(key, type) {
            var html = "<div data-selected='false' class='card noselect'>" +
                            "<span>" + type + "</span>" +
                        "</div>";
            $('#namedStealPopup #cardDisplay').append(html);
        });
    },
    
    updateCardsForElement: function(cards, element) {
        //Clear cards
        element.empty();
        
        $.each(cards, function(index, card) {
            var html = "<div data-selected='false' data-id='" + card.id +"' class='card noselect'>" +
                            "<span>" + card.name + "</span>" +
                        "</div>";
            
            element.append(html);
            
        });
    },
    
    /**
     * Update the player display
     * @param {Object} EK The main game instance
     */
    updatePlayerList: function(EK) {
        if (EK.getCurrentUser() && EK.getCurrentUserGame()) {
            var game = EK.getCurrentUserGame();
            
            //Clear players
            $('#playerList .content').empty();
            
            //Add players to the list
            $.each(game.players, function(index, player) {
                var user = EK.users[player.user];
                var classString = (game.isGameHost(user)) ? "status-blue" : "";
                var html = "<div class='user data-id='" + user.id + "'>" + 
                                "<div id='name' class='" + classString + "'>" + user.name + "</div>" +
                                "<div class='status status-" + player.statusColor(game) +"'>" + player.status(game) + "</div>" +
                            "</div>";

                //Check that we don't double up on adding users
                if ($("#playerList .content .user[data-id='" + user.id + "']").length < 1) {
                    $('#playerList .content').append(html);
                }
            });
        
            //Set the user count
            $('#playerList .top-bar').text('Connected Players ( ' + game.players.length + ' )');
            
        }
    },
    
    /**
     * Update the overlays in game
     * @param {Object} EK The main game instance
     */
    updateGameOverlay: function(EK) {
        this.updateGiveOverlay(EK);
        this.updatePlayerSelectOverlays(EK);
        this.updateFavorWaitOverlay(EK);
    },
    
    /**
     * Update give card overlay
     * @param {Object} EK The main game instance
     */
    updateGiveOverlay: function(EK) {
        var from = EK.gameData.favor.from;
        if (from) {
            var user = EK.users[from];
            $('#givePopup #text').text('Give ' + user.name + ' a card.');
        }
    },
    
    /**
     * Update overlays which require a player select
     * @param {Object} EK The main game instance
     */
    updatePlayerSelectOverlays: function(EK) {
        //Clear the options
        $('.popup #player-select').empty();
        
        //Add all players except us
        var user = EK.getCurrentUser();
        var game = EK.getCurrentUserGame();
        if (game) {
            $.each(game.players, function(index, player) {
                if (!(player.user === user.id)) {
                    var current = EK.users[player.user];
                    var html = '<option value="' + current.id + '">' + current.name + '</option>';
                    
                    //Add to all player selects
                    $('.popup #player-select').each(function(index, element) {
                        $(this).append(html);
                    });
                }
            });
        }
    },
    
    /**
     * Update favor wait overlay
     * @param {Object} EK The main game instance
     */
    updateFavorWaitOverlay: function(EK) {
        var to = EK.gameData.favor.to;
        if (to) {
            var user = EK.users[to];
            $('#givePopup #text').text('Wait for a favor from ' + user.name + '.');
        }
    },
    
    showGiveOverlay: function(EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#givePopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    showBlindStealOverlay: function(EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#blindStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    showNamedStealOverlay: function(EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#namedStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    showDiscardStealOverlay: function(EK) { 
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#discardStealPopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    showFavorWaitOverlay: function(EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#favorWaitPopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    showFavorSelectOverlay: function(EK) {
        this.updateGameOverlay(EK);
        $('#overlay').show();
        $('#overlay .popup').hide();
        $('#favorSelectPopup').show();
        $('#playingInput button').addClass('disabled');
    },
    
    hideOverlay: function() {
        $('#overlay').hide();
        $('#playingInput button').removeClass('disabled');
    },
    
    /**
     * Whether the play button should be enabled.
     * This occurs when cards are selected and to make sure that no invalid combos are played.
     * @returns {Boolean} Whether the play button should be enabled
     */
    shouldEnablePlayButton: function(EK) {
        //Get selected cards and add them to an array
        var ids = $("#playingInput .card[data-selected='true']");
        var cards = [];
        ids.each(function(index, element) {
            var id = $(this).data('id');
            var card = EK.gameData.getCardFromHand(id);
            if (card) {
                cards.push(card);
            }
        });
        
        switch (cards.length) {
            case 1: //Don't allow playing defuse, regular or explode (if it somehow got into players hand)
                return !(cards[0].type === $C.CARD.DEFUSE || cards[0].type === $C.CARD.EXPLODE || cards[0].type == $C.CARD.REGULAR); 
            case 2: //Blind pick
            case 3: //Named pick
                return EK.gameData.cardsMatching(cards);
            case 5: 
                return EK.gameData.cardsDifferent(cards);
            default:
                return false;
        }
        
        return false;
    },
    
    /**
     * Log a message into the chat
     * @param {String} message The message
     */
    logMessage: function(message) {
        var dt = new Date();
        var utcDate = dt.toUTCString();
        var html = "<div class='message'>[" + utcDate + "] " + message + "</div>";
        $('#messages').append(html);
        
        
        $('#messages').animate({
            scrollTop: $('#messages')[0].scrollHeight
        }, 500);
    }
};