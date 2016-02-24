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

/* Make color different if player draws up a card */

jQuery(document).ready(function($) {
    
    //TODO: Order cards by type, makes it easier for everyone
    
    //Main game instance
    var main = new EK();
    
    //Connect to socket
    io = io.connect();
    
    //Init scrollbars
    $('.scrollable').perfectScrollbar();
    $(window).resize(function() {
        $('.scrollable').perfectScrollbar('update');
    });
    
    //******** Click Events ********//
    
    $('#leaveButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        if (game) {
            io.emit($C.GAME.LEAVE, { gameId: game.id });
        }
    });
    
    $("#loginButton").bind('click touchstart', function(e) {
        e.preventDefault();
        var nickname = $('#nameInput').val();
        io.emit($C.LOBBY.CONNECT, { nickname: nickname });
    });
    
    $("#newGameButton").bind('click touchstart', function(e) {
        e.preventDefault();
        var name = prompt("Type in a title:", "bob");
        if (name) {
            io.emit($C.GAME.CREATE, { title: name });
        }
    });
    
    //Since we dynamically create the button, we have to call the clikc function this way
    $(document).on('click touchstart', '#joinGameButton', function(e) {
        e.preventDefault();
        var id = $(this).data("id");
        if (id) {
            io.emit($C.GAME.JOIN, { gameId: id });
        }
    });
    
    $('#startGameButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var user = main.getCurrentUser();
        var game = main.getCurrentUserGame();
        if (user && game) {
            if (!game.isGameHost(user)) {
                GameRoom.logError('Error: Game can only be started by hosts');
                return;
            }
            
            if (!game.canStart()) {
                GameRoom.logError('Cannot start game.');
                return;
            }
            
            io.emit($C.GAME.START, { gameId: game.id });
        }
    });
    
    $('#readyGameButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        if (game) {
            io.emit($C.GAME.PLAYER.READY, { gameId: game.id });
        };
    });
    
    $('#playGameButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
    
        switch (cards.length) {
            case 1:
                var card = main.gameData.getCardFromHand(cards.data('id'));
                if (card.type === $C.CARD.FAVOR) {
                    GameRoom.showFavorSelectOverlay(main);
                } else {
                    io.emit($C.GAME.PLAYER.PLAY, { 
                        gameId: main.getCurrentUserGame().id,
                        cards: cardIdsFromDOMData(cards)
                    });
                }
                break;
            case 2:
                GameRoom.showBlindStealOverlay(main);
                break;
            case 3:
                GameRoom.showNamedStealOverlay(main);
                break;
            case 5:
                GameRoom.showDiscardStealOverlay(main);
                break;
        }
    });
    
    $('#drawGameButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        if (game && !main.gameData.currentPlayedSet) {
            io.emit($C.GAME.PLAYER.ENDTURN, { gameId: game.id });
        };
    });
    
    $('#giveCardButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        var from = main.gameData.favor.from;
        if (game && from) {
            //Get the selected card id
            var cards = $("#givePopup .card[data-selected='true']");
            
            if (cards.length > 0) {
                //Get the first card id (since we only need to give 1 card)
                var id = cards.data('id');
                
                //Give the card to the 'from' player
                io.emit($C.GAME.PLAYER.FAVOR, {
                    gameId: game.id,
                    to: from,
                    card: id
                });
            }
            
        }
    
    });
    
    $('#favorSelectButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#favorSelectPopup #player-select').val();
        var game = main.getCurrentUserGame();
        
        if (cards.length > 0 && to && game) {
            
            //Play the favor card
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to
            });
            
            GameRoom.hideOverlay();
        }
        
    });
    
    $('#blindStealButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#blindStealPopup #player-select').val();
        var game = main.getCurrentUserGame();
        
        if (cards.length > 0 && to && game) {
            
            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to
            });
            
            GameRoom.hideOverlay();
        }
        
    });
    
    $('#namedStealButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var to = $('#namedStealPopup #player-select').val();
        var cardTypes = $("#namedStealPopup .card[data-selected='true']");
        var game = main.getCurrentUserGame();
        
        if (cards.length > 0 && cardTypes.length > 0 && to && game) {
            
            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                to: to,
                cardType: cardTypes.data('type')
            });
            
            GameRoom.hideOverlay();
        }
        
    });
    
    $('#discardStealButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var cards = $("#playingInput .card[data-selected='true']");
        var discardCards = $("#discardStealPopup .card[data-selected='true']");
        var game = main.getCurrentUserGame();
        
        if (cards.length > 0 && discardCards.length > 0 && game) {
            
            //Play the cards and the steal
            io.emit($C.GAME.PLAYER.PLAY, {
                gameId: game.id,
                cards: cardIdsFromDOMData(cards),
                cardId: discardCards.data('id')
            });
            
            GameRoom.hideOverlay();
        }
        
    });
    
    $('#nopeGameButton').bind('click touchstart', function(e) {
        e.preventDefault();
        var game = main.getCurrentUserGame();
        var currentSet = main.gameData.currentPlayedSet;
        if (game && main.gameData.hasCardTypeInHand($C.CARD.NOPE) && currentSet) {
            
            //If we are the one who played the set and the amount of nopes is even then don't emit the event
            if (currentSet.owner.user.id === main.getCurrentUser().id && (main.gameData.currentPlayedSet.nopeAmount % 2 == 0)) {
                console.log('Cannot nope: ' + main.gameData.currentPlayedSet.nopeAmount + ' played');
                return;
            }
            
            io.emit($C.GAME.PLAYER.NOPE, {
                gameId: game.id,
                setId: main.gameData.currentPlayedSet.id
            });
        }
    });
    
    //Card click
    $(document).on('click touchstart', '#playingInput .card', function(e) {
        e.preventDefault();
        toggleCardSelected($(this));
        GameRoom.updateInputDisplay(main);
    });
    
    $(document).on('click touchstart', '.popup .card', function(e) {
        e.preventDefault();
        $('.popup .card').attr('data-selected', "false");
        $('.popup .card').removeClass('card-selected');
        toggleCardSelected($(this));
        GameRoom.updateInputDisplay(main);
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
        main.addUser(new User(data.user.id, data.user.name));
        Lobby.updateUserList(main);
    });
    
    io.on($C.USER.DISCONNECT, function(data) {
        main.removeUser(data.user.id);
        Lobby.updateUserList(main);
    });
    
    io.on($C.GAME.UPDATE, function(data) {
        if (main.games[data.game.id]) {
            main.addGame(gameFromData(data.game));
        }
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.CREATE, function(data) {
        if (!data.hasOwnProperty('error')) {
            //Hide lobby
            Lobby.hide();
            
            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            main.gameData = new GameData();
            
            //Update
            GameRoom.update(main);
            
            //Tell user they joined the game
            GameRoom.logSystem(main.getCurrentUser().name + ' joined the game.');
            
            //Ready up
            io.emit($C.GAME.PLAYER.READY, { gameId: data.game.id});
        }
    });
    
    io.on($C.GAME.CREATED, function(data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.START, function(data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {
            //Update game data
            main.addGame(gameFromData(data.game));
            
            //Reset local game data
            main.gameData = new GameData();
            GameRoom.update(main);
            
            //Get hand and discard piles
            var game = main.getCurrentUserGame();
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });

            GameRoom.logSystem('Started Game!');
        }
    });
    
    io.on($C.GAME.STARTED, function(data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.STOP, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        
        //Reset local game data
        main.gameData = new GameData();
        GameRoom.updateCardDisplay(main);
        
        //Force ready
        forceGameHostReady(main.getCurrentUserGame());
    });
    
    io.on($C.GAME.STOPPED, function(data) {
        main.addGame(gameFromData(data.game));
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.WIN, function(data) {
        GameRoom.logSystemGreen(data.user.name + ' WON!');
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
        if (data.hasOwnProperty('success')) {
            //Hide lobby
            Lobby.hide();
            
            //Update data we have
            main.addGame(gameFromData(data.game));
            
            //Set the current game
            main.getCurrentUser().currentGame = data.game.id;
            main.gameData = new GameData();
            
            //Update
            GameRoom.update(main);
            GameRoom.logSystem(main.getCurrentUser().name + ' joined the game.');
        }
    });
    
    io.on($C.GAME.LEAVE, function(data) {
        if (data.hasOwnProperty('success')) {
            //Show lobby
            Lobby.show();
            
            //Reset stats
            main.gameData = new GameData();
            GameRoom.updateCardDisplay(main);
            
            main.getCurrentUser().currentGame = null;
        }
    });
    
    //Update player ready state
    io.on($C.GAME.PLAYER.READY, function(data) {
        var game = main.getCurrentUserGame();
        
        if (game) {
            game.updatePlayer(data.player)
        }
        
        //Force the game host to be ready
        forceGameHostReady(game);
        
        //Update
        GameRoom.update(main);
    });
    
    io.on($C.GAME.PLAYER.CONNECT, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        GameRoom.logSystem(data.player.user.name + ' joined the game.');
    });
    
    io.on($C.GAME.PLAYER.DISCONNECT, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        GameRoom.logSystem(data.player.user.name + ' left the game.');
        
        //We need to check if current user was getting a favor or giving a favor to the disconnected player
        var player = data.player;
        if (player) {
            var user = player.user;
            
            if (user.id === main.gameData.favor.to) {
                //We asked this player for a favor
                main.gameData.favor.to = null;
                GameRoom.hideOverlay();
                GameRoom.logLocal("The coward feld!");
            }
            
            if (user.id === main.gameData.favor.from) {
                //We got asked for a favor from this user
                main.gameData.favor.from = null;
                GameRoom.hideOverlay();
                GameRoom.logLocal("You did the man a favor and kicked his butt!");
            }
        }
        
        //Get the discard pile
        io.emit($C.GAME.DISCARDPILE, { gameId: main.getCurrentUserGame().id });
        
        //We may have a new game host, so force them to be ready
        forceGameHostReady(main.games[data.game.id]);
    });
    
    io.on($C.GAME.PLAYER.HAND, function(data) {
        var game = main.getCurrentUserGame();
        if (game) {
            main.gameData.hand = data.hand;
            
            //Update display for the user
            GameRoom.update(main);
        }
    });
    
    io.on($C.GAME.PLAYER.FUTURE, function(data) {
        var cards = data.cards;
        if (cards.length > 0) {
            //Tell player of the cards they see
            var string = "You see a ";
            $.each(cards, function(index, card) {
                string += card.name + ', ';
            });
            string = string.slice(0, -2); //Remove ', '
            GameRoom.logLocal(string);
        } else {
            GameRoom.logLocal('There is nothing to see!');
        }
    });
    
    io.on($C.GAME.DISCARDPILE, function(data) {
        var game = main.getCurrentUserGame();
        if (game) {
            main.gameData.discardPile = data.cards;
            GameRoom.update(main);
        }
    });
    
    io.on($C.GAME.PLAYER.ENDTURN, function(data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else if (data.hasOwnProperty('force')) {
            //Force end turn
            io.emit($C.GAME.PLAYER.ENDTURN, { gameId: main.getCurrentUserGame().id });
        } else {
            //Update game data
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);
            
            var game = main.getCurrentUserGame();
            var user = data.player.user;
            
            //Fetch the hand and discard piles
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
            
            var message = null;
            switch (data.state) {
                case $C.GAME.PLAYER.TURN.DEFUSED:
                    message = user.name + " defused the bomb!";
                    break;
                case $C.GAME.PLAYER.TURN.EXPLODED:
                    message = user.name + " exploded!";
                    break;
                case $C.GAME.PLAYER.TURN.SURVIVED:
                    message = user.name + " survived their turn.";
                    break;
            }
            
            //Send the state message to user
            if (message) {
                GameRoom.logSystem(message);
            }
            
            //Send messages to users
            if (data.state == $C.GAME.PLAYER.TURN.SURVIVED) {
                var nextPlayer = game.getCurrentPlayer();
                var nextUser = main.users[nextPlayer.user];
                var currentUser = main.getCurrentUser();
                
                //The turn message
                var turnMessage = (currentUser.id === nextUser.id) ? "It is your turn!" : "It is " + nextUser.name + "'s turn!";
                GameRoom.logSystem(turnMessage);
                
                //Tell the player how much they have to draw
                if (currentUser.id === nextUser.id) {
                    GameRoom.logLocal("Draw " + nextPlayer.drawAmount + " card(s)!");
                }
                
            }
        }
    
    });
    
    io.on($C.GAME.PLAYER.DRAW, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.update(main);
        
        if (data.hasOwnProperty('hand')) {
            main.gameData.hand = data.hand;
            GameRoom.updateCardDisplay(main);

            //Tell the user what cards they drew
            if (data.cards) {
                var type = "";
                $.each(data.cards, function(index, card) {
                    GameRoom.logLocal("You drew a " + card.name + ".");
                });
            }
            
            //Tell the user if they have to draw more cards
            var user = main.getCurrentUser();
            var game = main.getCurrentUserGame();
            if (user && game) {
                var player = game.getPlayer(user);
                
                //Only tell user to draw more if they have a draw amount >= 1 after removing current drawn
                if (player.drawAmount - 1 >= 1) {
                    GameRoom.logLocal("Draw " + (player.drawAmount - 1) + " card(s)!");
                }
            }
            
        } else {
            GameRoom.logSystem(data.player.user.name + " drew a card.");
        }
    });
    
    io.on($C.GAME.PLAYER.PLAY, function(data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {
            //Tell users that a player played cards
            var user = data.player.user;
            var cards = data.cards;
            if (cards) {
                var string = '';
                $.each(cards, function(index, card) {
                    string += card.name + ", ";
                });
                
                //Trim excess
                string = string.slice(0, -2);
                
                var playString = (cards.length <= 1) ? " played a " : " played ";
                GameRoom.logSystemGreen(user.name + playString + string + " card(s).");
            }
            
            //Set the new set
            if (data.set) {
                main.gameData.currentPlayedSet = data.set;
                //GameRoom.update(main);
                GameRoom.logSystem("A player can play a nope card!");
                startNopeTimer();
            }
            
            //Update game
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);
            
            //Get hand again once playing
            var cUser = main.getCurrentUser();
            var game = main.getCurrentUserGame();
            if (cUser && cUser.id === user.id) {
                io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            }
            
            //Get the discard pile
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
        }
    });
    
    io.on($C.GAME.PLAYER.NOPE, function(data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else if (data.hasOwnProperty('canNope')) {
            if (main.gameData.currentPlayedSet) {                
                GameRoom.logSystem("Cannot play any more nope cards!");
            }
            main.gameData.currentPlayedSet = null;
            GameRoom.update(main);
            
            //Update nope button timer
            $('#nopeGameButton').text('Nope');
            $('#nopeGameButton').attr('data-count', 0);
        } else {
            //Tell users that nope was played
            var user = data.player.user;
            var cards = data.cards;
            if (cards) {
                $.each(cards, function(index, card) {
                    GameRoom.logSystemGreen(user.name + " played a " + card.name + " card.");
                });
            }
            
            //Set the new set
            main.gameData.currentPlayedSet = data.set;
            
            //Update game data
            main.addGame(gameFromData(data.game));
            GameRoom.update(main);
            
            //Start the timer again
            startNopeTimer();
            
            //Get hand again once someone played a nope
            var cUser = main.getCurrentUser();
            var game = main.getCurrentUserGame();
            if (cUser && cUser.id === user.id) {
                io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
            }
            
            //Get the discard pile
            io.emit($C.GAME.DISCARDPILE, { gameId: game.id }); 
        }
    
    });
    
    io.on($C.GAME.PLAYER.STEAL, function(data) {
        var from = main.users[data.from];
        var to = main.users[data.to];
        var currentUser = main.getCurrentUser();
        var fromString = "";
        var toString = "";
        
        //Only set strings if we have the data
        if (from) {
            fromString = (currentUser.id === from.id) ? "You" : from.name;
        }
        
        if (to) {
            toString = (currentUser.id === to.id) ? "You" : to.name
        }
        
        switch(data.type) {
            case $C.CARDSET.STEAL.BLIND:
                GameRoom.logSystemGreen(fromString + " took a card from " + toString+ ".");
                
                //Tell the players involved what they lost or gained
                if (currentUser.id === from.id) {
                    GameRoom.logLocal("You took a " + data.card.name+ ".");
                }
                
                if (currentUser.id === to.id) {
                    GameRoom.logLocal("You lost a " + data.card.name+ ".");
                }
                
                break;
            case $C.CARDSET.STEAL.NAMED:
                //Use logLocal so that the card taking stands out
                if (data.success) {
                    GameRoom.logSystemGreen(fromString + " took a " + data.cardType + " from " + toString+ ".");
                } else {
                    GameRoom.logSystemGreen(fromString + " failed to take a " + data.cardType + " from " + toString+ ".");
                }
                break;
            case $C.CARDSET.STEAL.DISCARD:
                //Use logLocal so that the card taking stands out
                if (data.success) {
                    GameRoom.logSystemGreen(fromString + " took a " + data.card.name + " from the discard pile.");
                } else {
                    GameRoom.logSystemGreen(fromString + " failed to take a " + data.card.name + " from  the discard pile.");
                }
                break;
        }
        
        //Update hand
        var game = main.getCurrentUserGame();
        if (currentUser.id === from.id || currentUser.id === to.id) {
            io.emit($C.GAME.PLAYER.HAND, { gameId: game.id });
        }
        
        //Get the discard pile
        io.emit($C.GAME.DISCARDPILE, { gameId: game.id });
    });
    
    io.on($C.GAME.PLAYER.FAVOR, function(data) {
        if (data.hasOwnProperty('error')) {
            GameRoom.logError(data.error);
        } else {
            
            var currentUser = main.getCurrentUser();
            var from = main.users[data.from.id];
            var to = main.users[data.to.id];
            var fromString = (currentUser.id === from.id) ? "You" : from.name;
            var toString = (currentUser.id === to.id) ? "You" : to.name;

            if (data.hasOwnProperty('force')) {
                GameRoom.logSystemGreen(fromString + " asked " + toString + " for a favor.");

                if (currentUser.id === from.id) {
                    //Current user asked the favor. Disable end turn button
                    main.gameData.favor.to = to.id;
                    GameRoom.showFavorWaitOverlay(main);
                }

                if (currentUser.id === to.id) {
                    //From user asked current user for a favor
                    //Show the favor screen
                    main.gameData.favor.from = from.id;
                    GameRoom.showGiveOverlay(main);
                }

            } else if (data.hasOwnProperty('success')) {
                GameRoom.logSystemGreen(fromString + " gave " + toString + " a " + data.card.name + ".");

                if (currentUser.id === to.id) {
                    //From user did current user a favor
                    main.gameData.favor.to = null;
                    GameRoom.hideOverlay();
                }

                if (currentUser.id === from.id) {
                    //Current user did the favor. 
                    main.gameData.favor.from = null;
                    GameRoom.hideOverlay();
                }
                
                if (currentUser.id === to.id || currentUser.id === from.id) {
                    io.emit($C.GAME.PLAYER.HAND, {
                        gameId: main.getCurrentUserGame().id
                    });
                }

            }
        }
    });
    
    /**
     * Dtart a 3 second timer on the nope button
     */
    var startNopeTimer = function() {
        //Add a timer to the nope
        $('#nopeGameButton').attr('data-count', 3);
        updateNopeButton();
        if ($('#nopeGameButton').attr('data-timer-started') == 1) return;
        
        var interval = setInterval(function() {
            var button = $('#nopeGameButton');
            var count = button.attr('data-count');
            button.attr('data-timer-started', 1);

            count --;
            button.attr('data-count', count);
            
            updateNopeButton(interval);
        }, 1000);
    }
    
    /**
     * Update nope button with the interval
     * @param {Object} interval The interval
     */
    var updateNopeButton = function(interval) {
        var button = $('#nopeGameButton');
        var count = button.attr('data-count');
        
        if (count < 0) {
            //Update nope button timer
            button.text('Nope');
            button.attr('data-count', 0);
            button.attr('data-timer-started', 0);
            if (interval) {
                clearInterval(interval);
            }
        } else {
            button.text('Nope (' + count + ')');
            GameRoom.logLocal(count + ' seconds to nope!');
        }
    }
    
    /**
     * Get the card ids from the dom data of cards
     * @param   {Object} data The card DOM data
     * @returns {Array}  An array of card ids
     */
    var cardIdsFromDOMData = function(data) {
        var cards = [];
        data.each(function(index, element) {
            cards.push($(this).data('id'));
        });
        return cards;
    };
    
    /**
     * Toggle the selected attribute on cards
     * @param {Object} card The card dom
     */
    var toggleCardSelected = function(card) {
        //Get select and invert
        var selected = card.attr("data-selected") === 'true'; 
        selected = !selected;

        if (selected) {
            card.addClass('card-selected');
        } else {
            card.removeClass('card-selected');
        }
        
        card.attr("data-selected", selected.toString());
    }
    
    /**
     * Force the game host to be ready
     * @param {Object} game The game
     */
    var forceGameHostReady = function(game) {
        //Check if the current user is host, if they are then don't allow them to be not ready
        var user = main.getCurrentUser();
        if (user && game && game.isGameHost(user)) {
            var player = game.getPlayer(user);
            if (player && !player.ready) {
                io.emit($C.GAME.PLAYER.READY, { gameId: game.id});
            }
        }
    }
    
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
                players.push(new Player(user.id, player.alive, player.ready, player.drawAmount, player.cardCount));
            }
        });
        
        return new Game(data.id, data.title, data.status, players, data.currentPlayerIndex, data.drawPileLength);
    }

});
