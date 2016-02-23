/**
  Exloding Ketchup. 
  A Exploding Kittens clone without kittens.
  Copyright (C) 2016  Mikunj Varsani

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
*/

var User = require('./user');
var Game = require('./game');
var $ = require('./constants');
var CardSet = require('./cardset');

/**
 * This class handles all the game logic
 * @param {Object} io The socket io
 * @param {Object} EK The game instance
 */
module.exports = function(io, EK) {
    
    //************ Socket routes ************// 
    
    io.on('connection', function(socket) {
        /**
         * Disconnect from the server
         * @param {Object} data The data
         */
        socket.on('disconnect', function(data) {
            
            if (socket.id in EK.connectedUsers) {
                //Get the user id and fetch their details
                var user = EK.connectedUsers[socket.id];
                if (!user) return;

                //Tell everyone the user disconnected
                io.emit($.USER.DISCONNECT, {
                    user: user
                });
                
                //Notify room
                if (user.currentRoom != $.LOBBY.ROOM) {
                    var game = EK.gameList[user.currentRoom];
                    if (game) {
                        io.in(user.currentRoom).emit($.GAME.PLAYER.DISCONNECT, {
                            player: game.getPlayer(user),
                            game: game.sanitize()
                        });
                        removeUserFromGame(user, game, io, socket);
                    }
                }

                //Leave all rooms
                socket.leave(user.currentRoom);

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
            
            //Check if nickname is between 3 and 10 characters
            if (nickname.length < 3 || nickname.length > 10) {
                socket.emit($.LOBBY.CONNECT, {
                    error: 'Name has to be between 3 and 10 characters!'
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
                user: user
            });

            //Get the game list data
            var gameList = [];
            for (var key in EK.gameList) {
                var game = EK.gameList[key];
                gameList.push(game.sanitize());
            }

            //Add the user and send them the data
            EK.addUser(user);
            socket.emit($.LOBBY.CONNECT, {
                success: 'Successfully connected',
                user: user,
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
            if (!title || title.length <= 0 || title.length >= 30) {
                socket.emit($.GAME.CREATE, {
                    error: "Bad Title"
                });
                return;
            }
            
            //Make sure title is unique
            for (var key in EK.gameList) {
                var game = EK.gameList[key];
                if (game.title === title) {
                    socket.emit($.GAME.CREATE, {
                        error: "Game with title already exists!"
                    });
                    return;
                }
            }
            
            //Make sure user is in lobby
            var user = EK.connectedUsers[socket.id];
            if (user.currentRoom != $.LOBBY.ROOM) {
                socket.emit($.GAME.CREATE, {
                    error: "User is in another lobby"
                });
                return;
            }

            //Generate a unique id
            var gameId = null;
            while (!gameId || gameId in EK.gameList) {
                gameId = EK.generateRandomID();
            }

            //Create the game
            var game = new Game(gameId, title);

            //Add the user
            if (!addUserToGame(user, game, socket)) {
                socket.emit($.GAME.CREATE, {
                    error: "Failed to create game"
                });
                return;
            }
            
            console.log('Game created: ' + gameId + ' ' + title);
            
            EK.addGame(game);

            //Tell everyone a game was created
            io.emit($.GAME.CREATED, {
                game: game.sanitize()
            });

            //Return the game data to the user
            socket.emit($.GAME.CREATE, {
                success: 'Game created',
                game: game.sanitize()
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
            
            //Notify the players in the game that user has joined
            socket.broadcast.in(game.id).emit($.GAME.PLAYER.CONNECT, {
                game: game.sanitize(),
                player: currentPlayer
            });

            //Send data to player
            socket.emit($.GAME.JOIN, {
                success: 'Successfully joined game!',
                game: game.sanitize()
            });
            
            //Send data to everyone
            io.emit($.GAME.UPDATE, {
                game: game.sanitize()
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
            
            //Get the player
            var player = game.getPlayer(user);
            
            //Remove the user from the game
            removeUserFromGame(user, game, io, socket);

            //Notify players that user has left
            io.in(game.id).emit($.GAME.PLAYER.DISCONNECT, {
                player: player,
                game: game.sanitize()
            });
            
            socket.emit($.GAME.LEAVE, {
                success: 'Left game'
            });
            
            io.emit($.GAME.UPDATE, {
                game: game.sanitize()
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
                        io.in(game.id).emit($.GAME.START, {
                            game: game.sanitize()
                        });
                        
                        //Message lobby
                        io.emit($.GAME.STARTED, { 
                            game: game.sanitize() 
                        });
                        
                        console.log('Started game: ' + game.id);
                    } else {
                        socket.emit($.GAME.START, {
                            error: 'Could not start game'
                        });
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
                    player: game.getPlayer(user)
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
                var player = game.getPlayer(user);
                
                //Return the player hand
                if (player) {
                    socket.emit($.GAME.PLAYER.HAND, {
                        player: game.getPlayer(user),
                        hand: game.getPlayer(user).hand
                    });
                }
            }
        });
        
        /**
         * Get the game discard pile
         * 
         * Request Data: {
         *   gameId: "game id"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.DISCARDPILE, function(data) {
            var game = EK.gameList[data.gameId];

            //We can only get discard pile if game is playing
            if (game && game.status == $.GAME.STATUS.PLAYING) {
                //Make sure user is in the game
                var user = EK.connectedUsers[socket.id];
                if (!game.getPlayer(user)) return;
                
                socket.emit($.GAME.DISCARDPILE, {
                    cards: game.getDiscardPile()
                });
            };
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

                //Only end turn if we are the current player and the last played set effect was fulfilled
                //E.g for favors you need to wait for the other player before you can end your turn
                if (game.cUserIndex == game.playerIndexForUser(user)) {
                    var state = $.GAME.PLAYER.TURN.SURVIVED;
                    var player = game.getPlayer(user);
                    
                    //Check if effects have been played
                    if (!effectsPlayed(game, player)) {
                        socket.emit($.GAME.PLAYER.ENDTURN, {
                            error: 'Waiting for card effect to take place'
                        });
                        return;
                    }
                    
                    if (player.drawAmount >= 1) {
                        //Make player draw a card and if it is an explode then remove a defuse
                        //If player has no defuse then player is out
                        var drawn = game.drawCards(player, 1);
                        socket.emit($.GAME.PLAYER.DRAW, {
                            game: game.sanitize(),
                            cards: drawn,
                            hand: player.hand
                        });
                        
                        //Tell other players that player drew a card
                        socket.broadcast.in(game.id).emit($.GAME.PLAYER.DRAW, {
                            game: game.sanitize(),
                            player: player
                        });
                    }

                    //Use while loop incase player picks up 2 explodes
                    while (player.hasCardType($.CARD.EXPLODE)) {                    
                        if (player.hasCardType($.CARD.DEFUSE)) {
                            //Remove deufse and add it to the discard pile
                            var defuse = player.removeCardType($.CARD.DEFUSE);
                            var set = new CardSet(player, [defuse]);
                            set.effectPlayed = true;
                            game.discardPile.push(set);
                            
                            //Add the bomb back into the draw pile at a random position
                            var explode = player.removeCardType($.CARD.EXPLODE);
                            var index = Math.floor(Math.random() * (game.drawPile.length - 1));
                            game.drawPile.splice(index, 0, explode);
                            
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
                        for (var key in game.players) {
                            var player = game.players[key];
                            if (player.alive) winner = player;
                        }

                        //Tell everyone user won
                        if (winner) {
                            io.in(game.id).emit($.GAME.WIN, {
                                user: winner.user
                            });
                        }

                        //Stop the game
                        stopGame(io, data)
                    } else {
                        
                        //Check if player defused or exploded, if so then they have to end their turn no matter the amount of draws remaining
                        if (!(state === $.GAME.PLAYER.TURN.SURVIVED)) player.drawAmount = 1; 
                        
                        player.drawAmount -= 1;
                        
                        if (player.drawAmount < 1) {
                            //Next players turn
                            var nextAlive = game.getNextAliveIndex(game.cUserIndex);
                            if (nextAlive != game.cUserIndex) {
                                game.cUserIndex = nextAlive;
                            }
                            
                            //Reset player draw amount (dead = 0, alive = 1)
                            player.drawAmount = Number(player.alive);

                            //Send state information back
                            io.in(game.id).emit($.GAME.PLAYER.ENDTURN, {
                                player: player,
                                state: state,
                                game: game.sanitize() //Send updated game info back
                            });
                        }
                    }
                }
            }
        });
        
        /**
         * Play cards.
         * 
         * Request Data: {
         *   gameId: "gameId",
         *   cards: [] //An array of card ids to play
         *   to: "User id" //Optional: The user to do the action against
         *   cardType: "Card type" //Optional: Type of card to steal
         *   cardId: "Card id to steal" //Optional: Card id to steal
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.PLAY, function(data) {
            var game = EK.gameList[data.gameId];
            if (game && game.status == $.GAME.STATUS.PLAYING) {
                //Check if it is the current users turn
                var user = EK.connectedUsers[socket.id];
                if (game.cUserIndex == game.playerIndexForUser(user) && data.cards.length > 0) {
                    var player = game.getPlayer(user);
                    
                    //Check if player is alive
                    if (!player.alive) {
                        socket.emit($.GAME.PLAYER.PLAY, {
                            error: 'Cannot play card'
                        });
                        return;
                    }
                    
                    //Check if effects have been played
                    if (!effectsPlayed(game, player)) {
                        socket.emit($.GAME.PLAYER.PLAY, {
                            error: 'Waiting for card effect to take place'
                        });
                        return;
                    }
                    
                    //Check if the player has the cards
                    if (!player.hasCardsWithId(data.cards)) {
                        socket.emit($.GAME.PLAYER.PLAY, {
                            error: 'Player does not have cards'
                        });
                        return;
                    }
                    
                    
                    //Get cards from the players hand
                    var cards = player.getCardsWithId(data.cards);
                    
                    //Disallow playing the defuse, regular or nope alone
                    if (cards.length == 1) {
                        if (cards[0].type === $.CARD.DEFUSE || cards[0].type === $.CARD.REGULAR || cards[0].type === $.CARD.NOPE) {
                            socket.emit($.GAME.PLAYER.PLAY, {
                                error: 'Cannot play defuse, regular or nope cards alone!'
                            });
                            return;
                        }
                        
                        if (cards[0].type === $.CARD.EXPLODE) {
                            socket.emit($.GAME.PLAYER.PLAY, {
                                error: 'Cannot play explode! How the heck did you even get it?'
                            });
                            return;
                        }
                    } 
                    
                    //Add the cards to a set
                    var playedSet = new CardSet(player, cards);
                    
                    //Whether the other specified player exists
                    var otherPlayerExists = function(data) {
                        var user = EK.connectedUsers[data.to];
                        var player = game.getPlayer(user);
                        
                        //Make sure we have a person 'to' do action on and that we're not doing the action to ourself and that the player is alive
                        return data.hasOwnProperty('to') && user && EK.connectedUsers[socket.id] != user && player && player.alive;
                    }
                    
                    //Check for combos
                    if (playedSet.cards.length > 1) {
                        var steal = playedSet.canSteal();
                        switch(steal) {
                            case $.CARDSET.STEAL.BLIND:
                                //Only steal if we have someone to steal from
                                if (!otherPlayerExists(data)) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'Invalid user selected'
                                    });
                                    return;
                                }
                                break;
                            case $.CARDSET.STEAL.NAMED:
                                //Only steal if we have someone to steal from
                                if (!otherPlayerExists(data)) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'Invalid user selected'
                                    });
                                    return;
                                }

                                //Make sure we have a specified card selected
                                if (!data.hasOwnProperty('cardType')) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'Invalid card type selected'
                                    });
                                    return;
                                }
                                break;

                            case $.CARDSET.STEAL.DISCARD:
                                //Make sure we have a specified card selected
                                if (!data.hasOwnProperty('cardId')) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'Invalid card type selected'
                                    });
                                    return;
                                }  
                                break;

                            default:
                                //Make sure to let the player know to only play 1 card at a time if not playing a combo
                                socket.emit($.GAME.PLAYER.PLAY, {
                                    error: 'Invalid combo'
                                });
                                return;
                        }
                    } else {
                        var card = playedSet.cards[0];
                        switch (card.type) {    
                            case $.CARD.FAVOR:
                                //Only favor if we have someone to get a favor from
                                if (!otherPlayerExists(data)) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'Invalid user selected'
                                    });
                                    return;
                                }
                                
                                var other = EK.connectedUsers[data.to];
                                var otherPlayer = game.getPlayer(other);
                                
                                //Check if the other player has any cards
                                if (otherPlayer && otherPlayer.hand.length < 1) {
                                    socket.emit($.GAME.PLAYER.PLAY, {
                                        error: 'User has no cards in their hand!'
                                    });
                                    return;
                                }
                                
                                break;
                        }
                    }
                    
                    //Remove the cards played and put them in the discard pile
                    player.removeCards(cards);
                    game.discardPile.push(playedSet);
                    
                    //Notify players that cards were played
                    io.in(game.id).emit($.GAME.PLAYER.PLAY, {
                        player: player,
                        cards: cards,
                        set: playedSet
                    });
                    
                    //Wait for nope requests
                    playedSet.nopePlayed = true;
                    checkNopes(playedSet, data, socket, game);
                    
                }
            }
        }); //End $.GAME.PLAYER.PLAY
        
        /**
         * Nope a played set.
         * 
         * Request Data: {
         *   gameId: "gameId",
         *   setId: "Set id to nope"
         * }
         * 
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.NOPE, function(data) {
            var game = EK.gameList[data.gameId];
            var user = EK.connectedUsers[socket.id];
            if (game && game.status == $.GAME.STATUS.PLAYING) {
                var pendingSet = EK.pendingSets[data.setId];
                
                //If the set is pending and the set has the same amount of nopes played ad passed in then we want to play nopes
                if (pendingSet && !pendingSet.set.nopePlayed) {
                    
                    var player = game.getPlayer(user);
                    
                    //Check if player has a nope
                    if (player && player.hasCardType($.CARD.NOPE)) {
                        
                        //Play the nope and set the pending set data
                        var card = player.removeCardType($.CARD.NOPE);
                        var cardSet = new CardSet(player, [card]);
                        cardSet.effectPlayed = true;
                        game.discardPile.push(cardSet);
                        
                        //Set the nope played and amount
                        EK.pendingSets[data.setId].set.nopePlayed = true;
                        EK.pendingSets[data.setId].set.nopeAmount += 1;
                    
                        //Notify players that a nope was played
                        io.in(game.id).emit($.GAME.PLAYER.NOPE, {
                            player: player,
                            cards: [card],
                            game: game.sanitize(),
                            set: EK.pendingSets[data.setId].set
                        });
                        
                    } else {
                        socket.emit($.GAME.PLAYER.NOPE, {
                        error: "Could not get player or you don't have a nope card!"
                        });
                    }
                    
                } else {
                    socket.emit($.GAME.PLAYER.NOPE, {
                        error: 'Could not play nope!'
                    });
                }
            }
        });
        
        /**
         * Give a favor to a player
         * 
         * Request Data: {
         *   gameId: "game id",
         *   to: "The user id to do favor to",
         *   card: "The card id"
         * }
         * @param {Object} data The data
         */
        socket.on($.GAME.PLAYER.FAVOR, function(data){
            //Get the game and check if it exists
            var game = EK.gameList[data.gameId];

            if (game && game.status == $.GAME.STATUS.PLAYING) {
                var user = EK.connectedUsers[socket.id];
                var player = game.getPlayer(user);
                
                //Check if we have right player
                if (!data.hasOwnProperty('to') || !EK.connectedUsers[data.to] || !game.getPlayer(EK.connectedUsers[data.to])) {
                    socket.emit($.GAME.PLAYER.FAVOR, {
                        error: 'Invalid player'
                    });
                    return;
                }
                
                //Check if current user has card
                if (!data.hasOwnProperty('card') || !game.getPlayer(user).hasCardWithId(data.card)) {
                    socket.emit($.GAME.PLAYER.FAVOR, {
                        error: 'Invalid card'
                    });
                    return;
                }
                
                //Check if the other person is currently the one doing their turn
                var other = EK.connectedUsers[data.to];
                var otherPlayer = game.getPlayer(other);
                
                if (otherPlayer === game.playerForCurrentIndex()) {
                    
                    //Check if the favor is still possible
                    if (!effectsPlayed(game, otherPlayer)) {
                        
                        //Make sure the last set is still not pending
                        var lastSet = game.getLastDiscardSet();
                        if (!EK.pendingSets[lastSet.id]) {
                            //Remove the card from player and give it to other player
                            var card = player.removeCardWithId(data.card);
                            otherPlayer.addCard(card);

                            //Set the effect play
                            game.discardPile[game.discardPile.length - 1].effectPlayed = true;

                            //Notify players of the favor
                            io.in(game.id).emit($.GAME.PLAYER.FAVOR, {
                                success: true,
                                to: other,
                                from: user,
                                card: card
                            });
                            return;
                        }
                    }
                }
                
                //If we hit here then favor did not go through
                socket.emit($.GAME.PLAYER.FAVOR, {
                    error: 'Something went wrong'
                });
            }
        });
    });
    
    //************ Socket methods ************//
    
    /**
     * Process the actions of a pending set
     * @param   {Object}   pendingSet The pending set object. Not to be confused with card set.
     */
    var processPendingSet = function(pendingSet) {
        //Emit most errors out from this method because the errors should have been handled by $.GAME.PLAYER.PLAY socket handler
        
        //Get data needed
        var data = pendingSet.data;
        var playedSet = pendingSet.set;
        var socket = pendingSet.socket;
        var game = EK.gameList[pendingSet.data.gameId];
        var user = EK.connectedUsers[socket.id];
        var player = game.getPlayer(user);
        
        //Keep track if we have to force user to end turn
        var endTurn = false;
        
        //Whether the other specified player exists
        var otherPlayerExists = function(data) {
            var user = EK.connectedUsers[data.to];
            var player = game.getPlayer(user);

            //Make sure we have a person 'to' do action on and that we're not doing the action to ourself and that the player is alive
            return data.hasOwnProperty('to') && user && EK.connectedUsers[socket.id] != user && player && player.alive;
        }

        //Check for combos
        if (playedSet.cards.length > 1) {
            var steal = playedSet.canSteal();
            switch(steal) {
                case $.CARDSET.STEAL.BLIND:
                    var other = EK.connectedUsers[data.to];
                    var otherPlayer = game.getPlayer(other);

                    //Remove a random card from the other players hand and add it to the current player
                    var card = otherPlayer.getRandomCard();
                    otherPlayer.removeCard(card);
                    player.addCard(card);

                    //Tell players that a steal occurred
                    io.in(game.id).emit($.GAME.PLAYER.STEAL, {
                        to: other.id,
                        from: socket.id,
                        card: card,
                        type: steal
                    });

                    //Set effect played
                    playedSet.effectPlayed = true;

                    break;
                case $.CARDSET.STEAL.NAMED:
                    var other = EK.connectedUsers[data.to];
                    var otherPlayer = game.getPlayer(other);
                    var type = data.cardType;

                    //Remove the specified card from the other players hand and add it to the current player
                    var card = otherPlayer.removeCardType(type);
                    if (card) {
                        player.addCard(card);

                        //Tell players that a steal occurred
                        io.in(game.id).emit($.GAME.PLAYER.STEAL, {
                            success: true,
                            to: other.id,
                            from: socket.id,
                            cardType: type,
                            card: card.id,
                            type: steal  
                        });
                    } else {
                        //Tell players that stealing was unsuccessful
                        io.in(game.id).emit($.GAME.PLAYER.STEAL, {
                            success: false,
                            to: other.id,
                            from: socket.id,
                            cardType: type,
                            type: steal
                        });
                    }

                    //Set effect played
                    playedSet.effectPlayed = true;

                    break;

                case $.CARDSET.STEAL.DISCARD:
                    //Get the data needed
                    var id = data.cardId;
                    var card = null;
                    var currentSet = null;

                    //Go through the discard pile and remove given card and add it to user
                    for (var key in game.discardPile) {
                        var set = game.discardPile[key];
                        if (set.hasCardWithId(id)) {
                            //Get the card and remove the set if it's empty
                            card = set.removeCardWithId(id);
                            if (card) {
                                currentSet = set; 
                                break;
                            }
                        }
                    }

                    //If card existed then give it to the user
                    if (card) {
                        player.addCard(card);

                        //Notify players of the steal
                        io.in(game.id).emit($.GAME.PLAYER.STEAL, {
                            success: true,
                            card: card,
                            type: steal,
                            from: socket.id
                        });
                    } else {
                        //Tell them of the failure
                        io.in(game.id).emit($.GAME.PLAYER.STEAL, {
                            success: false,
                            type: steal,
                            from: socket.id
                        });
                    }

                    //Set effect played
                    playedSet.effectPlayed = true;

                    //Remove the set from the discard pile if it's empty
                    if (currentSet && currentSet.isEmpty()) {
                        game.discardPile.splice(game.discardPile.indexOf(currentSet));
                    }

                    break;

                default:
                    //Make sure to let the player know to only play 1 card at a time if not playing a combo
                    socket.emit($.GAME.PLAYER.PLAY, {
                        error: 'Invalid combo'
                    });
            }
        } else {
            var card = playedSet.cards[0];
            switch (card.type) {
                case $.CARD.ATTACK:
                    //Attack the next person that is alive
                    var nextPlayer = game.getNextAlive(game.cUserIndex);

                    //Set the draw amount to 0 so that we just end our turn without drawing anything
                    player.drawAmount = 0;
                    nextPlayer.drawAmount = 2;

                    //Force player to end turn
                    endTurn = true;

                    //Set the sets effect to played
                    playedSet.effectPlayed = true;

                    break;

                case $.CARD.FAVOR:
                    var other = EK.connectedUsers[data.to];
                    var otherPlayer = game.getPlayer(other);
                    
                    //Set the favor to false
                    playedSet.effectPlayed = false;

                    //Check if the other player has any cards
                    //Tough luck if a player gets this D:
                    //This can happen if the favor goes through even with nopes and the person has no card
                    if (otherPlayer && otherPlayer.hand.length < 1) {
                        socket.emit($.GAME.PLAYER.PLAY, {
                            error: 'User has no cards in their hand!'
                        });
                        playedSet.effectPlayed = true;
                    } else {
                        //Ask other player for favor
                        io.in(game.id).emit($.GAME.PLAYER.FAVOR, {
                            force: true,
                            from: user,
                            to: other
                        });
                    }

                    break;
                case $.CARD.FUTURE:

                    //Get the first 3 cards on the top of the draw pile
                    var futureCards = [];
                    for (var i = 0; i < 3; i++)
                    {
                        if (game.drawPile[i]) {
                            futureCards.push(game.drawPile[i]);
                        }
                    }

                    //Set the effect to played
                    playedSet.effectPlayed = true;

                    //Send the cards to the player
                    socket.emit($.GAME.PLAYER.FUTURE, {
                        cards: futureCards
                    });

                    break;

                case $.CARD.SKIP:
                    //Remove 1 draw amount as 1 skip = 1 draw amount
                    player.drawAmount -= 1;

                    //Force player to end turn
                    if (player.drawAmount < 1) {
                        endTurn = true;
                    }

                    //Set the sets effect to played
                    playedSet.effectPlayed = true;
                    break;

                case $.CARD.SHUFFLE:
                    //Shuffle the deck
                    game.shuffleDeck();

                    //Set the sets effect to played
                    playedSet.effectPlayed = true;
                    break;
            }
        }

        //Update the discard pile
        game.updateDiscardSet(playedSet);
        
        //Notify players again that cards were played
        io.in(game.id).emit($.GAME.PLAYER.PLAY, {
            player: player,
            cards: playedSet.cards
        });

        //Send user info about ending turn
        if (endTurn) {
            //Tell player to force end turn
            socket.emit($.GAME.PLAYER.ENDTURN, {
                force: true,
                player: player
            });
        }
    }
    
    /**
     * Check if any nopes were played.
     * If a nope was played then extend timer by 3 seconds.
     * If no nopes were played then process the played set
     * @param {Object} playedSet The played set
     * @param {Object} data The data
     * @param {Object} socket The socket      
     * @param {Object} game The game    
     */
    var checkNopes = function(playedSet, data, socket, game) {
        var pending = EK.pendingSets[playedSet.id];
        if (!pending) {
            EK.addPendingSet(playedSet, data, socket);
            pending = EK.pendingSets[playedSet.id];
        }
        
        if (pending.set.nopePlayed) {
            EK.pendingSets[playedSet.id].set.nopePlayed = false;
            setTimeout(function() {
                checkNopes(pending.set, data, socket, game);
            }, 3000);
        } else {
            
            //If there is an even amount of nopes played then we can process
            if (pending.set.nopeAmount % 2 == 0) {
                processPendingSet(pending);
            } else {
                pending.set.effectPlayed = true;
                
                //Update the discard pile
                game.updateDiscardSet(pending.set);
            }
            
            //Notify players that set cannot be noped any more
            if (pending.data && pending.data.gameId) {
                io.in(pending.data.gameId).emit($.GAME.PLAYER.NOPE, {
                    set: pending.set,
                    canNope: false
                });
            }
            
            //Remove the set from pending
            EK.removePendingSet(pending.set);
        }
    }
    
    /**
     * Whether the last card sets effects were played
     * @param   {Object}   game   The game
     * @param   {Object} player The player
     * @returns {Boolean}  True if the last sets effects were played else false
     */
    var effectsPlayed = function(game, player) {
        //Check for last set effect played
        if (game.discardPile.length > 0) {
            var lastSet = game.getLastDiscardSet();
            if (lastSet.owner == player) {
                return lastSet.effectPlayed;
            }
        }
        
        return true;
    }
    
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
        if (user.currentRoom) {
            socket.leave(user.currentRoom);
        }

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
        var currentPlayer = game.playerForCurrentIndex();
        
        if (player) {  
            
            //Remove the user from the game
            game.removePlayer(user);
            
            //If game was in progress then put players cards in the discard pile
            if (game.status === $.GAME.STATUS.PLAYING) {
                
                for (var key in player.hand) {
                    var card = player.hand[key];
                    var set = new CardSet(player, [card]);
                    game.discardPile.push(set);
                }
                
                player.hand = [];
                
                //Check for a winner
                if (game.playerAliveCount() < 2) {
                    var winner = null;
                    for (var key in game.players) {
                        var player = game.players[key];
                        if (player.alive) winner = player;
                    }

                    //Tell everyone user won
                    if (winner) {
                        io.in(game.id).emit($.GAME.WIN, {
                            user: winner.user
                        });
                    }

                    //Stop the game
                    stopGame(io, { gameId: game.id })
                } else {
                    
                    //Check if the player is the current one drawing, if so determine winner or force next turn
                    if (player === currentPlayer) {
                        //TODO: When last player leaves the next alive player is not set 
                        //Next players turn
                        var nextAlive = game.getNextAliveIndex(game.cUserIndex - 1);
                        game.cUserIndex = nextAlive;

                        //Send state information back
                        io.in(game.id).emit($.GAME.PLAYER.ENDTURN, {
                            player: player,
                            state: $.GAME.PLAYER.TURN.DISCONNECT,
                            game: game.sanitize()
                        });
                    }
                    
                }
            
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
            
            //Tell players
            io.in(game.id).emit($.GAME.STOP, {
                game: game.sanitize()
            });
            
            //Tell lobby
            io.emit($.GAME.STOPPED, {
                game: game.sanitize()
            });
            
            console.log('Stopped game: ' + game.id);
        }
    }
}