var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var EK = require('./game/EK');
var Logic = require('./game/logic');

app.use(express.static(__dirname + '/public'));

//Setup app
var port = normalizePort(process.env.PORT || '7076');
server.listen(port, function() {
    console.log("listening on *:" + port);
});

//Show default stuff
app.get('/', function(req, res) {
  res.render('/index.html');
});

//Game & Logic
var game = new EK(io);
var logic = new Logic(io, game);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}


module.exports = app;
