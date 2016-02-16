var User = require('./user');
var Game = require('./game');
var $ = require('./constants');

/**
 * This class handles all the game logic
 * @param {Object} io The socket io
 * @param {Object} EK The game instance
 */
module.exports = function(io, EK) {
    
    //************ Socket routes ************// 
    
    io.on('connection', function(socket) {
        console.log('hi ' + socket.id);
    
        /**
         * Disconnect from the server
         * @param {Object} data The data
         */
        socket.on('disconnect', function(data) {
            console.log('bye ' + socket.id);
            
            if (socket.id in EK.connectedUsers) {
                //Get the user id and fetch their details
                var user = EK.connectedUsers[socket.id];
                if (!user) return;

                //Tell everyone the user disconnected
                io.emit($.USER.DISCONNECT, user);
                io.in(user.currentRoom).emit($.GAME.PLAYER.DISCONNECT, user);

                //Leave all rooms
                socket.leave(user.currentRoom);
                
                //Remove user from their current game if they were in it
                if (user.currentRoom != $.LOBBY.ROOM) {
                    var game = EK.gameList[user.currentRoom];
                    removeUserFromGame(user, game, io, socket);
                }

                //Remove the user from connected users
                EK.removeUser(user);
            }
        });
        
        /**
         * Connect to lobby
         * Responds with connected users and game list.
         * 
         * Request Data: {
         *   nickname: "User nickname"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.LOBBY.CONNECT, function(data) {
            var valid = (data && data.hasOwnProperty('nickname'));

            //Check for valid nickname
            if (!valid) {
                socket.emit($.LOBBY.CONNECT, {
                    error: 'Invalid name'
                });
                return;
            }

            var nickname = data.nickname;

            //Check if a user with name is connected
            if (EK.isUserWithNameConnected(nickname)) {
                socket.emit($.LOBBY.CONNECT, {
                    error: 'User is already connected with that name!'
                });
                return;
            }
            
            //Check if current user is already connected
            if (socket.id in EK.connectedUsers) {
                socket.emit($.LOBBY.CONNECT, {
                    error: 'User is already connected with a different name!'
                });
                return;
            }

            //Join the lobby
            socket.join($.LOBBY.ROOM);

            //Create user
            var user = new User(socket.id, data.nickname);
            console.log('User Connecting: ' + user.id + ' ' + user.name);

            //Tell everyone user has connected
            user.currentRoom = $.LOBBY.ROOM;
            socket.broadcast.emit($.USER.CONNECT, {
                id: user.id,
                name: user.name
            });

            //Get the game list data
            var gameList = [];
            for (var key in EK.gameList) {
                var game = EK.gameList[key];
                gameList.push({
                    id: game.id,
                    title: game.title,
                    status: game.status,
                    players: game.players
                });
            }

            //Add the user and send them the data
            EK.addUser(user);
            socket.emit($.LOBBY.CONNECT, {
                success: 'Successfully connected',
                connectedUsers: EK.connectedUsers,
                gameList: gameList
            });
        });

        /**
         * Create a game.
         * Responds with game data if created else an error.
         * 
         * Request Data: {
         *   title: "Game title"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.CREATE, function(data) {
            var title = data.title;
            if (title.length <= 0 || title.length >= 30) {
                socket.emit($.GAME.CREATE, {
                    error: "Bad Title"
                });
                return;
            }

            var user = EK.connectedUsers[socket.id];

            //Generate a unique id
            var gameId = null;
            while (!gameId || gameId in EK.gameList) {
                gameId = EK.generateRandomID();
            }

            //Create the game
            var game = new Game(gameId, title);
            EK.addGame(game);
            
            console.log('Game created: ' + gameId + ' ' + title);

            //Add the user
            if (!addUserToGame(user, game, socket)) {
                socket.emit($.GAME.CREATE, {
                    error: "Failed to create game"
                });
                return;
            }

            var gameData = {
                id: game.id,
                title: game.title,
                players: game.players,
                status: game.status
            };

            //Tell everyone a game was created
            io.emit($.GAME.CREATED, gameData);

            //Return the game data to the user
            socket.emit($.GAME.CREATE, {
                success: 'Game created',
                game: gameData
            });
        });

        /**
         * Join a game on the server.
         * Responds with players and game data.
         *
         * Request Data: {
         *   gameId: "Game Id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.JOIN, function(data) {
            //Get the game and check if it exists
            var game = EK.gameList[data.gameId];
            var user = EK.connectedUsers[socket.id];

            if (!game) {
                socket.emit($.GAME.JOIN, {
                    error: 'Invalid game'
                });
                return;
            }

            //Add player
            if (!addUserToGame(user, game, socket)) {
                socket.emit($.GAME.JOIN, {
                    error: 'Failed to join game'
                });
                return;
            }

            var currentPlayer = game.getPlayer(user);

            //Create player data
            var players = []
            for (var player in game.players) {
                players.push({
                    user: player.user
                });
            }

            //Notify the players in the game that user has joined
            socket.broadcast.in(game.id).emit($.GAME.PLAYER.CONNECT, {
                game: game,
                user: currentPlayer.user
            });

            //Send data to player
            socket.emit($.GAME.JOIN, {
                success: 'Successfully joined game!',
                players: players,
                game: game,
                user: currentPlayer.user
            });
        });

        /**
         * Leave a game.
         * If no one is left in game then it is destroyed
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.LEAVE, function(data) {
            //Get the game and check if it exists
            var game = EK.gameList[data.gameId];
            var user = EK.connectedUsers[socket.id];
            if (!game) {
                socket.emit($.GAME.LEAVE, {
                    error: 'Invalid game'
                });
                return;
            }

            //Check if we have to stop the game (happens when players < min players)
            if (game.players.length < game.minPlayers) {
                stopGame(io, data);
            }
            
            //Remove the user from the game
            removeUserFromGame(user, game, io, socket);

            //Notify players that user has left
            io.in(game.id).emit($.GAME.PLAYER.DISCONNECT, {
                user: user
            });
        });



        /**
         * Start a game.
         * All players must be ready and the person initiating must be the host
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.START, function(data) {
            var game = EK.gameList[data.gameId];

            if (game && game.status == $.GAME.STATUS.WAITING) {
                var user = EK.connectedUsers[socket.id];
                if (user === game.gameHost()) {
                    if (game.start()) {
                        //Tell everyone game has started, from there they individually send a request for their hand
                        io.in(game.id).emit($.GAME.START);
                        console.log('Started game: ' + game.id);
                    }
                }
            }

        });

        /**
         * Stop a game.
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.STOP, function(data) {
            stopGame(io, data);
        });

        /**
         * Ready up for the next game.
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.READY, function(data) {
            var game = EK.gameList[data.gameId];

            //We can only ready up if the game state is waiting
            if (game && game.status == $.GAME.STATUS.WAITING) {
                var user = EK.connectedUsers[socket.id];
                var ready = game.toggleReady(user);

                //Tell everyone in room the ready state of the player
                io.in(game.id).emit($.GAME.PLAYER.READY, {
                    user: user,
                    ready: ready
                });
            }
        });

        /**
         * Get the current users hand
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.HAND, function(data) {
            var game = EK.gameList[data.gameId];

            //We can only get hand if game is playing
            if (game && game.status == $.GAME.STATUS.PLAYING) {
                var user = EK.connectedUsers[socket.id];

                //Return the player hand
                socket.emit($.GAME.PLAYER.HAND, {
                    user: user,
                    hand: game.getPlayer(user).hand
                });
            }
        });

        /**
         * End current players turn
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.ENDTURN, function(data) {
            //Get the game and check if it exists
            var game = EK.gameList[data.gameId];

            if (game && game.status == $.GAME.STATUS.PLAYING) {
                var user = EK.connectedUsers[socket.id];

                //Only end turn if we are the current player
                if (game.cUserIndex == game.playerIndexForUser(user)) {
                    var state = $.GAME.PLAYER.TURN.SURVIVED;
                    var player = game.getPlayer(user);

                    //Make player draw a card and if it is an explode then remove a defuse
                    //If player has no defuse then player is out
                    var drawn = game.drawCards(player, player.drawAmount);
                    socket.emit($.GAME.PLAYER.DRAW, {
                        user: player.user,
                        drawn: drawn,
                        cards: player.hand
                    });

                    //Use while loop incase player picks up 2 explodes
                    while (player.hasCardType($.CARD.EXPLODE)) {
                        if (player.hasCardType($.CARD.DEFUSE)) {
                            //Remove deufse and add it to the discard pile
                            var defuse = player.removeCardType($.CARD.DEFUSE);
                            game.discardPile.push(defuse);
                            state = $.GAME.PLAYER.TURN.DEFUSED;
                        } else {
                            //Player exploded
                            state = $.GAME.PLAYER.TURN.EXPLODED;
                            game.explodePlayer(player);
                        }
                    }

                    //Check for a winner
                    if (game.playerAliveCount() < 2) {
                        var winner = null;
                        for (var player in game.players) {
                            if (player.alive) winner = player;
                        }

                        //Tell everyone user won
                        io.in(game.id).emit($.GAME.WIN, {
                            user: winner
                        });

                        //Stop the game
                        stopGame(io, data)
                    } else {
                        //Next players turn
                        game.incrementIndex();

                        //Go to the next alive player
                        while(game.playerAliveCount() > 1 && !game.playerForCurrentIndex().alive) {
                            game.incrementIndex();
                        }

                        //Reset player draw amount (dead = 0, alive = 1)
                        player.drawAmount = Number(player.alive);

                        //Send state information back
                        io.in(game.id).emit($.GAME.PLAYER.ENDTURN, {
                            user: player.user,
                            alive: player.alive,
                            state: state,
                            next: game.playerForCurrentIndex().user
                        });
                    }
                }
            }
        });
    });
    
    //************ Socket methods ************//
    
    /**
     * Add user to a game
     * @param   {Object}  user The user
     * @param   {Object}  game The game
     * @param   {Object}  socket  The socket
     * @returns {Boolean} Whether adding user to game was successful
     */
    var addUserToGame = function (user, game, socket) {
        //Add the user to the game
        if (!game.addPlayer(user))
            return false;

        //Leave old room
        socket.leave(user.currentRoom);

        //Join the game room
        user.currentRoom = game.id;
        socket.join(game.id);

        return true;
    }
    
    /**
     * Remove user from a game
     * @param {Object}   user     The user
     * @param {Object}   game     The game
     * @param {Object}   io       The socket io
     * @param {Object}   socket   The socket
     */
    var removeUserFromGame = function (user, game, io, socket) {
        var player = game.getPlayer(user);
        
        if (player) {
            //Remove the user from the game
            game.removePlayer(user);
            
            //If game was in progress then put players cards in the discard pile
            if (game.status === $.GAME.STATUS.PLAYING) {
                for (var card in player.hand) {
                    game.discardPile.push(card);
                }
                
                player.hand = [];
            }
        }
        
        //Leave old room
        socket.leave(user.currentRoom);

        //Join the lobby
        user.currentRoom = $.LOBBY.ROOM;
        socket.join($.LOBBY.ROOM);
        
        //Check if we have to remove game
        if (game.players.length == 0) {
            io.emit($.GAME.REMOVED, {
                id: game.id
            });
            EK.removeGame(game);
            console.log('Removed game: ' + game.id);
            return;
        }
    }
    
    /**
     * Stop the current game
     * @param {Object} io   The io
     * @param {Object} data The data
     */
    var stopGame = function(io, data) {
        var game = EK.gameList[data.gameId];
        
        if (game && game.stop()) {
            io.in(game.id).emit($.GAME.STOP);
            console.log('Stopped game: ' + game.id);
        }
    }
}