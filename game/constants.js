var $ = {
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
            },
            HAND: 'playerHand',
            DRAW: 'playerDraw',
            PLAY: 'playerPlayCard',
            DISCARDSELECT: 'playerDiscardSelect',
            STEAL: 'playerSteal'
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
//Socket
/*$.LOBBY = {};
$.LOBBY.ROOM = 'lobby';
$.LOBBY.CONNECT = 'connecting';
$.LOBBY.DISCONNECT = 'disconnect';
$.LOBBY.JOIN = 'joinLobby';

$.GAME = {};
$.GAME.CREATE = 'createGame';
$.GAME.JOIN = 'joinGame';
$.GAME.LEAVE = 'leaveGame';
$.GAME.CREATED = 'gameCreated';
$.GAME.START = 'startGame';
$.GAME.STOP = 'stopGame';

$.GAME.STATUS = {};
$.GAME.STATUS.WAITING = 'gameStatusWaiting';
$.GAME.STATUS.PLAYING = 'gameStatusPlaying';

$.USER = {};
$.USER.CONNECT = 'userConnected';
$.USER.DISCONNECT = 'userDisconnected';

$.PLAYER = {};
$.PLAYER.CONNECT = 'playerConnected';
$.PLAYER.DISCONNECT = 'playerDisconnected';

$.ROUND = {};
$.ROUND.DATA = 'roundData';
$.ROUND.NEW = 'newRound';
*/
module.exports = $;