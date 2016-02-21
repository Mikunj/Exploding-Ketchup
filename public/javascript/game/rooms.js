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
        this.updateInputDisplay(EK);
        this.updateCardDisplay(EK);
        this.updatePlayerList(EK);
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

                    //TODO: Toggle play when cards are selected
                    //TODO: Add end turn button here
                    if ($(".card[data-selected='true']").length < 1) {
                        drawButton.show();
                        playButton.hide();
                    } else {
                        playButton.show();
                        drawButton.hide();
                    }
                } else {
                    playButton.hide();
                    drawButton.hide();
                }

            }
        }
    },
    
    /**
     * Display cards in current users hand.
     * All cards get auto deselected.
     * @param {Object} EK The main game instance
     */
    updateCardDisplay: function(EK) {
       /*<div data-selected="true" class="card">
            <span>DEFUSE</span>
        </div>*/
        
        //Clear cards
        $('#cardDisplay').empty();
        
        $.each(EK.gameData.hand, function(index, card) {
            var html = "<div data-selected='false' data-id='" + card.id +"' class='card noselect'>" +
                            "<span>" + card.name + "</span>" +
                        "</div>";
            
            $('#cardDisplay').append(html);
            
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