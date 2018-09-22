
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var map = new Map();

// static files
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use(express.static(__dirname + "/client"))

// width of map
var width = 1000;
var height = 500;

// width of camera
var cameraWidth = 375;
var cameraHeight = 250;

function Character(sock, id) {
  var char = this;
  console.log("Character created with id ");
  this.posx = ((width) * Math.random());
  this.posy = ((height) * Math.random());
  this.dir = 0;
  this.id = id;
  this.score = 0;
  this.lastShot = 0;
  
  map.set(id, [this, sock]);

  this.onMove = function(d){
    char.dir = d;
  };
  sock.on('move', this.onMove);
  
  sock.on('shoot', function() {
    if (Date.now() - lastShot > 2) {
      var lastShot = Date.now();
      usbs.push(new USB(xpos, ypos, dir));
    }
  });
  
  sock.on('disconnect', function() {
    console.log('Player disconnecting:');
  
    for (var i = players.length - 1; i >= 0; i--)
    {
      if (sock == map.get(players[i].id)[1])
      {
        console.log("Player with id:" + id + " was disconnected");
        map.delete(players[i].id)
        delete players[i];
        players.splice(i, 1);
      }
    }
  });
}

function Book() {
  this.posx = ((width) * Math.random());
  this.posy = ((height) * Math.random());
  }

function USB(x, y, dir) {
  this.posx = x;
  this.posy = y;
  switch (dir) {
    case 1:
      xpos -= 20;
      break;
    case 2:
      ypos -= 20;
      break;
    case 3:
      xpos += 20;
      break;
    case 4:
      ypos += 20;
      break;
  }
}

function getNearby(p, players) {
  var nearby = [];
  for (o in players) {
    if (Math.abs(p.xpos - players[o].xpos) > cameraWidth / 2) {
      continue;
    } else if (Math.abs(p.ypos - players[o].ypos) > cameraHeight / 2) {
      continue;
    } else {
      nearby.push(players[o]);
//      console.log(o);
    }
  }
  return nearby;
}

var players = [];
var books = [];
var usbs = [];


io.on('connection', function(socket) {
  console.log('connection');
  
  socket.on('getId', function(id){
    console.log("ID recieved");
    var id = id
    var newGuy = new Character(socket, id);
    players.push(newGuy);
  });
  
  socket.on('checkName', function(tempid){
    for (var l = 0; l < players.length; l++){
      if (tempid == players[l].id){
        
      }
    }
  });
});



setInterval(function() {
//  console.log(players);
  for (var i = 0; i < players.length; i++) {
    var tempPlayer = players[i];
    switch (tempPlayer.dir)
        {
          case 1:
            tempPlayer.posx = tempPlayer.posx - 1;
            if (tempPlayer.posx < 0)
            {
              tempPlayer.posx = 0;
            }
            break;
          case 2:
           tempPlayer.posy = tempPlayer.posy - 1;
            if (tempPlayer.posy < 0)
            {
              tempPlayer.posy = 0;
            }
                break;
          case 3:
              tempPlayer.posx = tempPlayer.posx + 1;
              if (tempPlayer.posx > (width - 10))
              {
                  tempPlayer.posx = width - 10;
              }
              break;
          case 4:
              tempPlayer.posy = tempPlayer.posy + 1;
              if (tempPlayer.posy > (height - 10))
              {
                  tempPlayer.posy = height - 10;
              }
              break;
        }
  }
  isCollide();
  map.forEach(function(val, key, map) {
    var currChar = map.get(key)[0];
    val[1].emit('update', [getNearby(currChar, players), books, usbs])
  });
}, 20);

setInterval(function() {
  for (var i = 0; i < players.length; i++){
      var newBook = new Book();
      books.push(newBook);
  }

}, 10000);

function isCollide(){
  for (var m = 0; m < players.length; m++){
    for (var n = 0; n < books.length; n++){
      if (Math.abs(players[m].posx - books[n].posx) <= 8 && Math.abs(players[m].posy - books[n].posy) <= 8){
        players[m].score += 1;
        delete books[n];
        books.splice(n, 1);
        console.log(players[m].score);
      }
    }
  }
}

http.listen(8080, "localhost");
