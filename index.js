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

var usernames = {};
var numUsers = 0;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));


io.on('connection', function (socket) {
  console.log("connection");
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    console.log("new message");
    console.log(data);
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    console.log("add user "+username);
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;

    //GESTION MULTIROOM
    // store the room name in the socket session for this client
    socket.room = 'room1';
    // add the client's username to the global list
    usernames[username] = username;
    // send client to room 1
    socket.join('room1');
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER', 'you have connected to room1');
    // echo to room 1 that a person has connected to their room
    socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
    socket.emit('updaterooms', rooms, 'room1');

    // FIN GESTION MULTIROOM

    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
    console.log(socket.username+" joined");

    //  initDb(socket);
    initGraphs(socket);

  });

  socket.on('initDb', function(){
    console.log('reinit');
    initDb(socket);
  });

  socket.on('newGraph', function(graphname){
    console.log('new graph '+graphname);
    var triple = {
      subject: graphname,
      predicate: "type",
      object: "Graphe",
      type: "graph"
    };
    boose.graph.put(triple, function(err,data) {
      console.log(err);
      console.log(data);
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    console.log("typing");
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    console.log("stop typing");
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom){
    // leave the current room (stored in session)
    console.log(newroom);
    rooms.indexOf(newroom) === -1 ? rooms.push(newroom) : console.log("This item already exists");
    socket.leave(socket.room);
    // join new room, received as function parameter
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
    console.log(rooms);
    socket.emit('updaterooms', rooms, newroom);
    socket.broadcast.emit('updaterooms', rooms );
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    console.log("disconnect");
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.leave(socket.room);

    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
      console.log(socket.username + " left");
    }
  });
/*
  socket.on("changeGraph", function(name){
    console.log("CHANGE GRAPH "+name);
    //cherche si le graph existe, si oui le renvoyer, sinon le créer
    if (!spog.graphs.includes(name)){
      spog.createGraph(name);
    }
    console.log(spog.graphs);
    console.log(spog.graphs.includes(name));
    boose.graph = name;
  });*/
  // de nouvelles actions à executer sont reçues d'un client
  socket.on('newActions', function(actions) {
    //console.log("newActions");
    // on ajoute à snapshot.Actions les actions reçues par le client
    var snapActions = tr.snapshot.actions;
    var newActions = snapActions.concat(actions);
    tr.snapshot.actions = newActions;
    console.log(actions);
    actions.forEach(function(action) {
      //pour chaque action reçue on effectue le boulot necéssaire selon son type
      switch (action.type) {
        case "newNode":
        //nouveau node du graphe ou modification
        console.log("newNode");
        var data = action.data;
        console.log(data);
        var triples = [];
        // si data.type == "graph" on créé un nouveau graphe
        /*    if (data.type == "graph"){
        console.log("CREATION d'un graphe");
        spog.createGraph(data.id);
        console.log(spog.graphs);
        var tripleGraph = {
        subject: data.id,
        predicate: "type",
        object: "Graph",
        type: "edge"
      };

      triples.push(tripleGraph);
      updateGraphs(socket);
    }*/



    //si newNode mais qu'il existe, c'est un renommage  donc on regarde s'il existe dans la base
    var triple = {
      subject: data.id,
      predicate: "label",
      object: data.label,
      type: data.type
    };

    triples.push(triple);
    if(data.shape != undefined){
      var tripleShape = {
        subject: data.id,
        predicate: "shape",
        object: data.shape,
        type: "shape"
      };
      triples.push(tripleShape);
    }
    if (data.color != undefined){
      var tripleColor = {
        subject: data.id,
        predicate: "color",
        object: data.color,
        type: "color"
      };
      triples.push(tripleColor);
    }
    console.log(triples);
    boose.graph.get({
      subject: data.id,
      /*          predicate: "label",
      object: data.label,*/
    }, function(err, list) {
      if (list.length == 0) {
        //console.log("ajoute");
        boose.graph.put(triples, function(err) {
          console.log("added");
        });
      } else {
        // si le noeud existe, on le supprime et le recréé avec les nouvelles valeurs, c'est la méthode pour modifier
        boose.graph.del(list, function(err, deleted) {
          console.log("deleted");
        });
        boose.graph.put(triples, function(err, putted) {
          console.log("added");
        });
      }
    });
    break;
    case "deleteNode":
    var nodeId = action.data.nodes;
    var edges = action.data.edges;
    boose.graph.get({
      subject: nodeId
    }, function(err, list) {
      boose.graph.del(list, function(err, deleted) {});
    });
    // PAS CERTAIN QUE LES LIENS SOIENT BIEN SUPPRIMES DU GRAPHE lorsque l'on supprime un noeud, A REVOIR
    edges.forEach(function(edgeId) {
      boose.graph.get({
        subject: edgeId
      }, function(err, list) {
        console.log("3 list");
        boose.graph.del(list, function(err, deleted) {});
      });
    });
    break;
    case "newEdge":
    console.log(action);
    //maj de la base
    var edge = action.data[0] || action.data;
    if (edge != undefined) {
      boose.graph.get({
        subject: edge.id
      }, function(err, list) {
        if (list.length == 0) {
          var tripleLabel = {
            subject: edge.id,
            predicate: "label",
            object: edge.label
          };
          var tripleFrom = {
            subject: edge.id,
            predicate: "from",
            object: edge.from
          };
          var tripleTo = {
            subject: edge.id,
            predicate: "to",
            object: edge.to
          };
          boose.graph.put([tripleLabel, tripleFrom, tripleTo], function(err) {
            console.log("added");
          });
        } else {
          var tripleLabel = {
            subject: edge.id,
            predicate: "label",
            object: edge.label
          };
          boose.graph.get({
            subject: edge.id,
            predicate: "label"
          }, function(err, listLabel) {
            boose.graph.del(listLabel[0], function(err, deleted) {
              console.log("deleted");
            });
            boose.graph.put(tripleLabel, function(err, putted) {
              console.log("added");
            });
          });
        }
      });
    } else {
      console.log("pb pour creer le edge, quel id ?")
    }
    break;
    case "editEdge":
    //non utilisé , regroupé avec newEdge
    console.log(action);
    break;
    case "deleteEdge":
    console.log(action);
    var edgeId = action.data.edges[0];
    console.log(edgeId);
    boose.graph.get({
      subject: edgeId
    }, function(err, list) {
      console.log(" 4 list");
      boose.graph.del(list, function(err, deleted) {
        console.log("deleted");
      });
    });
    break;
    default:
    console.log("action non reconnue");
    console.log(action);
  }
});
});



//});



});
