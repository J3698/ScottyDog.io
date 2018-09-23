
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
  console.log("Character created with id " + id);
  this.posx = ((width) * Math.random());
  this.posy = ((height) * Math.random());
  this.dir = 0;
  this.id = id;
  this.time = 16;
  this.score = 0;
  this.lastShot = 0;
  
  map.set(id, [this, sock]);

  this.onMove = function(d){
    char.dir = d;
  };
  sock.on('move', this.onMove);
  
  sock.on('shoot', function() {
    console.log(Date.now() - char.lastShot);
    if (Date.now() - char.lastShot > 2) {
      char.lastShot = Date.now();
      usbs.push(new USB(char.posx, char.posy, char.dir, true));
    }
  });
  
  sock.on('disconnect', function() {
    console.log('Player disconnecting:');
  
    for (var i = players.length - 1; i >= 0; i--)
    {
      if (map.get(players[i].id) == undefined)
      {
        console.log("Tried to delete " + players[i].id + " but they didn't exist.");
      }
      else if (sock == map.get(players[i].id)[1])
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

function USB(x, y, dir, evil) {
  this.posx = x;
  this.posy = y;
  this.evil = evil;
  switch (dir) {
    case 1:
      this.posx += 20;
      break;
    case 2:
      this.posy += 20;
      break;
    case 3:
      this.posx -= 20;
      break;
    case 4:
      this.posy -= 20;
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
  
  socket.on('fail', function(id){
    killPlayer(id);
  });
  
  socket.on('checkName', function(tempid){
    console.log("Checking in the server if " + tempid + " is a valid ID.");
    if (players.length == 0)
    {
      console.log("Length was at 0, emitting a positive nameMatch");
      socket.emit('nameMatch', 0);
    }
    else
    {
      var t = true;
      for (var l = 0; l < players.length; l++){
        if (tempid == players[l].id){
          socket.emit('nameMatch', 1);
          t = false;
        }
      }
      if(t)
        {
          console.log("Emitting a positive nameMatch");
          socket.emit('nameMatch', 0);
        }
    }
  });
});

function killPlayer(Id)
{
  console.log("Killing player " + Id + ", list size is " + players.length);
  for (var i = players.length - 1; i >= 0; i--)
  {
    if (players[i].id == Id)
    {
      console.log("A player was deleted.");
      players.splice(i,i);
    }
  }
  map.delete(Id);
  io.emit('death', Id);
  console.log("Player killed, final list size is " + players.length);
}



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
  
  //Sort player list
  //Please dear god let this work
  /*
  isSorted = false;
  while (!isSorted)
  {
    isSorted = true;
    for (var i = 0; i < players.length - 1; i++)
    {
      if (players[i].score < players[i + 1])
      {
        isSorted = false;
        var temp = players[i];
        players[i] = players[i+1];
        players[i+1] = temp;
      }
    }
  }
  */
  function compare(a, b)
  {
    let comparison = 0;
    if (a.score > b.score)
    {
      comparison = -1;
    }
    if (a.score < b.score)
    {
      comparison = 1;
    }
    return comparison;
  }
  
  players.sort(compare)
}, 20);

setInterval(function() {
  for (var i = 0; i < players.length; i++){
      var newBook = new Book();
      books.push(newBook);
  }

}, 10000);

setInterval(function() {
  for (var z = 0; z < players.length / 3; z++){
      var newUSB = new USB((width) * Math.random(), (height) * Math.random(), 1, false)
      usbs.push(newUSB);
  }

}, 5000);

function isCollide(){
  var deathNote = []

  for (var m = 0; m < players.length; m++){
    for (var n = 0; n < books.length; n++){
      if (Math.abs(players[m].posx - books[n].posx) <= 8 && Math.abs(players[m].posy - books[n].posy) <= 8){
        players[m].score += 1;
        delete books[n];
        books.splice(n, 1);
        console.log(players[m].score);
        map.get(players[m].id)[1].emit('pass', 15);
      }
    }

    for (var o = 0; o < usbs.length; o++){
      
      if (Math.abs(players[m].posx - usbs[o].posx) <= 8 && Math.abs(players[m].posy - usbs[o].posy) <= 8){
        if (usbs[o].evil == true){
          deathNote.push(players[m].id);
        }
        else{
          players[m].score += 3;
          map.get(players[m].id)[1].emit('pass', 25);
        }
        delete usbs[o];
        usbs.splice(o, 1);
      }
    }
  }

  for (i in deathNote) {
      killPlayer(deathNote[i]);
  }
}

var port = process.env.PORT;
var ip = process.env.IP;
/*
if (port == null || port == "") {
  var port = 8080;
}
if (ip == null || ip == "") {
  var ip = "localhost";
}
*/
http.listen(port, ip);
