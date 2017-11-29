// voir avec levelgrap-jsonld pour stocker les noeuds sous forme d'objet json
// Setup basic express server
//https://socket.io/docs/emit-cheatsheet/#
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;

var Boose = require('./boose');
var boose = new Boose( 'sublevel', 'SmagBoose', 'graph0');

var Tempsreel = require('./tempsreel');
var tr = new Tempsreel(io);

console.log(boose);

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));
