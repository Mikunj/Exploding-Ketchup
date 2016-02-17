jQuery(document).ready(function($) {
    
    var users = {};
    
    io = io.connect();
    
    //******** Click Events ********//
    
    $("#loginButton").click(function() {
        console.log('bob');
        var nickname = $('#login div input').val();
        if (nickname.length < 1) {
            $('#login .error').text('Invalid name');
        } else {
            joinLobby(nickname);
        }
    });
    
    //******** IO Events ********//
    
    io.on($C.LOBBY.CONNECT, function(data) {
        if (data.hasOwnProperty('success')) {
            //Clear players
            $('#lobby #userList').empty();
            
            //Add the connected users to the user list
            for (var key in data.connectedUsers) {
                var user = data.connectedUsers[key];  
                users[user.id] = user;
            }
            
            populateUserList();
            
            $('#login').hide();
            
            /*socket.emit($.LOBBY.CONNECT, {
                success: 'Successfully connected',
                connectedUsers: EK.connectedUsers,
                gameList: gameList
            });*/
            
        }
        
        if (data.hasOwnProperty('error')) {
            $('#login .error').text(data.error);
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

    io.on('gameCreated', function(data) {
        console.log(data);
    });

    io.on('gameRemoved', function(data) {
        console.log(data);
    });
    
    
    //******** Methods ********//

    var joinLobby = function(nickname) {
        io.emit($C.LOBBY.CONNECT, { nickname: nickname });
    }
    
    var populateUserList = function() {
        $('#lobby #userList').empty();
        $.each(users, function(key, user) {
            var html = "<div class='user' data-id='" + user.id + "'>" + user.name + "</div>";

            //Check that we don't double up on adding users
            if ($(".user[data-id='" + user.id + "']").length < 1) {
                $('#lobby #userList').append(html);
            }
        });
    }
    
    var removeUserFromLobby = function(id) {
        $(".user[data-id='" + id + "']").remove();
    }
});
