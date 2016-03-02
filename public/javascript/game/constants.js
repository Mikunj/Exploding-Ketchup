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

var $C = {
    LOBBY: {
        ROOM: 'lobby',
        CONNECT: 'connected',
        DISCONNECT: 'disconnect',
    },
    
    GAME: {
        CREATE: 'createGame',
        JOIN: 'joinGame',
        LEAVE: 'leaveGame',
        CREATED: 'gameCreated',
        START: 'startGame',
        STOP: 'stopGame',
        STARTED: 'gameStarted',
        STOPPED: 'gameStopped',
        WIN: 'winGame',
        UPDATE: 'updateGame',
        DISCARDPILE: 'discardPile',
        STATUS: {
            WAITING: 'gameWaiting',
            PLAYING: 'gamePlaying'
        },
        PLAYER: {
            READY: 'playerReady',
            CONNECT: 'playerConnected',
            DISCONNECT: 'playerDisconnected',
            STATUS: {
                NOTREADY: 'Not Ready',
                READY: 'Ready',
                WAITING: 'Waiting',
                PLAYING: 'Playing',
                DEAD: 'Dead'
            },
            ENDTURN: 'playerEndTurn',
            TURN: {
                INVALID: 'invalid',
                DEFUSED: 'defused',
                EXPLODED: 'exploded',
                SURVIVED: 'survived',
                DISCONNECT: 'disconnected'
            },
            HAND: 'playerHand',
            DRAW: 'playerDraw',
            PLAY: 'playerPlayCard',
            STEAL: 'playerSteal',
            FAVOR: 'playerFavor',
            FUTURE: 'playerFuture',
            NOPE: 'playerNope'
        },
        REMOVED: 'gameRemoved'
    },
    
    USER: {
        CONNECT: 'userConnected',
        DISCONNECT: 'userDisconnected'
    },

    CARD: {
        ATTACK: 'Attack',
        NOPE: 'Nope',
        DEFUSE: 'Defuse',
        EXPLODE: 'Explode',
        SKIP: 'Skip',
        FUTURE: 'Future',
        FAVOR: 'Favor',
        SHUFFLE: 'Shuffle',
        REGULAR: 'Regular',
        REVERSE: 'Reverse'
    },
    
    CARDSET: {
        STEAL: {
            BLIND: 'blindSteal',
            NAMED: 'namedSteal',
            DISCARD: 'discardSteal',
            INVALID: 'invalidSteal'
        }
    }
};