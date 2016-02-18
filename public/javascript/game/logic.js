jQuery(document).ready(function($) {
    
    //TODO Move this to another class
    var users = {};
    var games = {};
    
    io = io.connect();
    
    //******** Click Events ********//
    
    $("#loginButton").click(function() {
        var nickname = $('#nameInput').val();
        if (nickname.length < 1) {
            $('#login .error').text('Invalid name');
            $('#login .error').fadeIn("slow");
        } else {
            joinLobby(nickname);
        }
    });
    
    $("#newGameButton").click(function() {
        var name = prompt("Type in a title:", "bob");
        io.emit($C.GAME.CREATE, { title: name });
    });
    
    //******** IO Events ********//
    
    io.on($C.LOBBY.CONNECT, function(data) {
        if (data.hasOwnProperty('success')) {
            
            //Add the connected users to the user list
            for (var key in data.connectedUsers) {
                var user = data.connectedUsers[key];  
                users[user.id] = user;
            }
            
            //Add the games to the list
            for (var key in data.gameList) {
                var game = data.gameList[key];
                games[game.id] = game;
            }
            
            populateUserList();
            populateGameList();
            
            $('#login').hide();
            
            /*socket.emit($.LOBBY.CONNECT, {
                success: 'Successfully connected',
                connectedUsers: EK.connectedUsers,
                gameList: gameList
            });*/
            
        }
        
        if (data.hasOwnProperty('error')) {
            $('#login .error').text(data.error);
            $('#login .error').fadeIn("slow");
        }
    });
    
    io.on($C.USER.CONNECT, function(data) {
        users[data.id] = data;
        populateUserList();
    });
    
    io.on($C.USER.DISCONNECT, function(data) {
        if (users[data.id]) {
            delete users[data.id];
        }
        populateUserList();
    });
    
    io.on($C.GAME.CREATE, function(data) {
        if (!data.hasOwnProperty('error')) {
            console.log('Created game');
        }
    });
    
    io.on($C.GAME.CREATED, function(data) {
        games[data.id] = data;
        populateGameList();
    });
          
    io.on($C.GAME.REMOVED, function(data) {
        if (games[data.id]) {
            delete games[data.id];
        }
        populateGameList();
    });
    
    
    //******** Methods ********//

    var joinLobby = function(nickname) {
        io.emit($C.LOBBY.CONNECT, { nickname: nickname });
    }
    
    var populateUserList = function() {
        $('#userList .content').empty();
        
        //Add user to the list
        $.each(users, function(id, user) {
            var html = "<div class='user' data-id='" + user.id + "'>" + user.name + "</div>";

            //Check that we don't double up on adding users
            if ($(".user[data-id='" + user.id + "']").length < 1) {
                $('#userList .content').append(html);
            }
        });
        
        for (var i = 0; i < 50; i++) {
            var html = "<div class='user' data-id='" + i + "'>" + i + "</div>";

            //Check that we don't double up on adding users
            if ($(".user[data-id='" + i + "']").length < 1) {
                $('#userList .content').append(html);
            }
        }
        
        //Set the user count
        $('#userList .top-bar').text('Connected Users ( ' + Object.keys(users).length + ' )');
    }
    
    var removeUserFromLobby = function(id) {
        $(".user[data-id='" + id + "']").remove();
    }
    
    var populateGameList = function() {
        $('#gameList .content').empty();
        
        //Add games to the list
        $.each(games, function(id, game) {
            var html = "<div class='game' data-id='" + game.id + "'>" +
                        "<div id='title'>" + game.title + "</div>" +
                        "<div id='status'>" + game.status + "</div>" +
                        "<div id='players'>Players: " + game.players.length + "</div>" +
                        "</div>"
            
            //Check that we don't double up on adding games
            if ($(".game[data-id='" + game.id + "']").length < 1) {
                $('#gameList .content').append(html);
            }
            
        });
        
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
});
