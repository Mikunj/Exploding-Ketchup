jQuery(document).ready(function($) {
    
    /**
    TODO: Make the host auto ready
    If the host leaves then the next host should auto ready
    Or make it that once everyone readies up then the game starts
    */
    
    //Main game instance
    var main = new EK();
    
    //Connect to socket
    io = io.connect();
    
    //******** Click Events ********//
    
    $("#loginButton").click(function() {
        var nickname = $('#nameInput').val();
        if (nickname.length < 1) {
           Login.showError('Name is too short!');
        } else {
            io.emit($C.LOBBY.CONNECT, { nickname: nickname });
        }
    });
    
    $("#newGameButton").click(function() {
        var name = prompt("Type in a title:", "bob");
        io.emit($C.GAME.CREATE, { title: name });
    });
    
    //******** IO Events ********//
    
    io.on($C.LOBBY.CONNECT, function(data) {
        if (data.hasOwnProperty('success')) {
            
            var connectedUsers = data.connectedUsers;
            var gameList = data.gameList;
            
            //Add the connected users to the user list
            $.each(connectedUsers, function(key, user) {
                main.addUser(new User(user.id, user.name));
            });
            
            //Add the games to the list
            $.each(gameList, function(key, game) {
                main.addGame(gameFromData(game));
            });
            
            //Set the current user
            var user = main.users[data.user.id];
            main.currentUser = data.user.id;
            
            //Update displays
            Lobby.updateUserList(main);
            Lobby.updateGameList(main);
            
            //Hide login
            Login.hide(); 
        }
        
        if (data.hasOwnProperty('error')) {
            Login.showError(data.error);
        }
    });
    
    io.on($C.USER.CONNECT, function(data) {
        main.addUser(new User(data.id, data.name));
        Lobby.updateUserList(main);
    });
    
    io.on($C.USER.DISCONNECT, function(data) {
        main.removeUser(data.id);
        Lobby.updateUserList(main);
    });
    
    io.on($C.GAME.CREATE, function(data) {
        if (!data.hasOwnProperty('error')) {
            //Hide lobby
            Lobby.hide();
            
            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            
            //Update
            GameRoom.updatePlayerList(main);
            
            //Ready up
            io.emit($C.GAME.PLAYER.READY, { gameId: data.game.id});
        }
    });
    
    io.on($C.GAME.CREATED, function(data) {
        main.addGame(gameFromData(data));
        Lobby.updateGameList(main);
    });
          
    io.on($C.GAME.REMOVED, function(data) {
        main.removeGame(data.id);
        
        //Replace the current game room for user
        if (main.getCurrentUserGame() && main.getCurrentUserGame().id == data.id) {
            main.getCurrentUser().currentGame = null;
        }
        
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.JOIN, function(data) {
        console.log(data);
        if (data.hasOwnProperty('success')) {
            //Hide lobby
            Lobby.hide();
            
            //Update data we have
            main.addGame(gameFromData(data.game));
            
            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            
            //Update
            GameRoom.updatePlayerList(main);
        }
    });
    
    //Update player ready state
    io.on($C.GAME.PLAYER.READY, function(data) {
        var user = main.users[data.user.id];
        var ready = data.ready;
        var game = main.getCurrentUserGame();
        
        if (game && user) {
            var player = game.getPlayer(user);
            player.ready = ready;
        }
        
        //Update
        GameRoom.updatePlayerList(main);
    });
    
    io.on($C.GAME.PLAYER.CONNECT, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.updatePlayerList(main);
        GameRoom.logMessage(data.player.user.name + ' joined the game.');
    });
    
    io.on($C.GAME.PLAYER.DISCONNECT, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.updatePlayerList(main);
        GameRoom.logMessage(data.player.user.name + ' left the game.');
    });
    
    /**
     * Create a game from data
     * @param   {Object}   data The data
     * @returns {Object} A game object
     */
    var gameFromData = function(data) {
        var players = [];
        
        //Add players
        $.each(data.players, function(index, player) {
            var user = main.users[player.user.id];
            if (user) {
                players.push(new Player(user, player.alive, player.ready));
            }
        });
        
        return new Game(data.id, data.title, data.status, players);
    }

});
