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
            FAVOR: 'playerFavor'
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
        REGULAR: 'Regular'
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