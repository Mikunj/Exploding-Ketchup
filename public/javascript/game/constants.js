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
        WIN: 'winGame',
        STATUS: {
            WAITING: 'gameWaiting',
            PLAYING: 'gamePlaying'
        },
        PLAYER: {
            READY: 'playerReady',
            CONNECT: 'playerConnected',
            DISCONNECT: 'playerDisconnected',
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
            DISCARDSELECT: 'playerDiscardSelect',
            STEAL: 'playerSteal',
            FAVOR: 'playerFavor'
        },
        REMOVED: 'gameRemoved'
    },
    
    USER: {
        CONNECT: 'userConnected',
        DISCONNECT: 'userDisconnected'
    },

    CARD: {
        ATTACK: 'attack',
        NOPE: 'nope',
        DEFUSE: 'defuse',
        EXPLODE: 'explode',
        SKIP: 'skip',
        FUTURE: 'future',
        FAVOR: 'favor',
        SHUFFLE: 'shuffle',
        REGULAR: 'regular'
    },
    
    CARDSET: {
        STEAL: {
            BLIND: 'blindSteal',
            NAMED: 'namedSteal',
            DISCARD: 'discardSteal',
            INVALID: 'invalidSteal'
        }
    },
    
    ROUND: {
        DATA: 'roundData',
        NEW: 'newRound'
    }
};