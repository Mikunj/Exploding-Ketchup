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
        
        
        //Add test users
        for (var i = 0; i < 50; i++) {
            var html = "<div class='user' data-id='" + i + "'>" + i + "</div>";

            //Check that we don't double up on adding users
            if ($(".user[data-id='" + i + "']").length < 1) {
                $('#userList .content').append(html);
            }
        }
    
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
                                "<button id='joinGameButton' class='btn btn-success btn-block" + disabledString + "' type='button'>Join</button>" +
                            "</div>" +
                        "</div>"
            
            
            //Check that we don't double up on adding games
            if ($(".game[data-id='" + game.id + "']").length < 1) {
                $('#gameList .content').append(html);
                
            }
            
        });
        
        //Add test games
        for (var i = 0; i < 50; i++) {
            var html = "<div class='game' data-id='" + i + "'>" +
                            "<div id='title'>" + i + "</div>" +
                            "<div id='status'>" + i + "</div>" +
                            "<div id='players'>Players: " + i + "</div>" +
                        "</div>"
            
            //Check that we don't double up on adding games
            if ($(".game[data-id='" + i + "']").length < 1) {
                $('#gameList .content').append(html);
            }
        }
        
    }
    
};

var GameRoom = {
    /**
     * Update the player display
     */
    updatePlayerList: function(EK) {
        if (EK.getCurrentUser() && EK.getCurrentUserGame()) {
            var game = EK.getCurrentUserGame();
            
            //Clear players
            $('#playerList .content').empty();
            
            //Add players to the list
            $.each(game.players, function(index, player) {
                var user = player.user;
                var html = "<div class='user data-id='" + user.id + "'>" + user.name +
                                "<div class='status status-" + player.statusColor() +"'>" + player.status() + "</div>" +
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
        $('#chatBox .content').append(html);
    }
};