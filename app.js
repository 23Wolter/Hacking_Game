const express = require('express');
const app = express(); 
var http = require('http').createServer(app);
const io = require('socket.io')(http); 
const path = require('path');
const mongoose = require('mongoose');

// file for my mongo schemas
const databasesetup = require('./server_scripts/databasesetup'); 

// get port from Heroku or port:3000
const port = process.env.PORT || 3000
http.listen(port, function() {
    console.log('listening on : ' + port); 
}); 

// set default folder to public
app.use(express.static(path.join(__dirname, 'public')));

// URL of mLab mongo database 
var mongoDB = 'mongodb://olini16:hacking-game2020@ds161112.mlab.com:61112/hacking-game'; 

// connect to mongodb 
mongoose.connect(mongoDB, { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});

// make mongoose connection
var db = mongoose.connection;

// log any db error
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// global variables for my schemas
var Room, Game, Player;

// initiate mongoose schemas after connection 
db.once('open', function() {
    console.log("Connected to db");
    
    Game = databasesetup.initGameSchema(); 
    Room = databasesetup.initRoomSchema();
    Player = databasesetup.initPlayerchema();  
});

// a list of all current socket connections
// sockets ids are used to identify players 
// this is not used for anything, just thought it might be handy to keep track of all sockets 
var sockets = []; 

// list of possible default commands 
// makes it easier to add future commands 
var commands = {
    command0: "HELP",
    command1: "LIST", 
    command2: "GOTO",
    command3: "OPEN"
};

// get index page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html'); 
}); 


// on socket connection 
io.on('connection', function(socket){ 
    
    //when a new client connects to the server, print welcome message
    console.log("user connection - welcome: ", socket.id);
    sockets.push(socket.id); 
    console.log("current sockets connected: ", sockets); 
    
    // emit welcome message to player 
    io.emit('welcome', socket.id); 
    
    // when user enters username 
    socket.on('check username', function(clientInfo) {

        // get socket-id and username from user 
        let socket_ID = clientInfo[0]; 
        let username = clientInfo[1]; 

        // read from db 
        // find a player with the given username 
        Player.find({'username': username}, function(err, playerfound) {
            if(err) console.error(err);
            playerfound = playerfound[0]; 
            console.log("db found this user: " + playerfound); 

            // emit the user found to client
            io.emit('user check', [socket_ID, playerfound]); 
        }); 
    }); 

    // when user enters password 
    socket.on('check password', function(clientInfo) {

        let socket_ID = clientInfo[0]; 
        let username = clientInfo[1];
        let password = clientInfo[2];

        // find a player with both username and password matching 
        Player.find({'username': username, 'password': password}, function(err, playerfound) {
            if(err) console.error(err); 
            playerfound = playerfound[0]; 

            io.emit('pass check', [socket_ID, playerfound]); 
        }); 
    }); 
    

    //if the client wish to host a new game
    socket.on('host game', function(clientInfo) {
        
        console.log("player chose to host game");

        // generates a new unique 4-digit game ID
        generateGameID(function(newGameID) {

            // create new game with the new game ID - and the hosting player ID 
            let newgame = new Game({
                gameID: newGameID, 
                playerNumber: 1,
                players: [
                    clientInfo[0]
                ]
            });
            
            console.log("newgame created: ", newgame); 
            
            // save new game to db 
            newgame.save(function (err) {
                if (err) console.error(err);

                // create a new player with the given username and password - set starting room to /root
                let newplayer = new Player({
                    playerID: clientInfo[0],
                    username: clientInfo[1].username,
                    password: clientInfo[1].password,
                    room: '/root'
                }); 

                newplayer.save(function(err) {
                    if(err) console.error(err); 
                    console.log("new player saved, now starting game");
                    
                    // tell client that the server is ready to start the game 
                    io.emit('hosting new game', [clientInfo[0], newgame]); 
                });
            });
        }); 
    });
    
    
    //if the client wish to join an existing game
    socket.on('join game', function(clientInfo) {
        
        let gameID = clientInfo[0]; 
        let player_ID = clientInfo[2]; 
        
        // create a new player with the given information 
        let newplayer = new Player({
            playerID: player_ID,
            username: clientInfo[1].username,
            password: clientInfo[1].password,
            room: '/root'
        }); 

        // check if any game exists with the given ID
        // if game exists, update with the new player
        // if no game exists, inform the client 
        Game.findOneAndUpdate({ 'gameID': gameID }, {
            $push: { players: player_ID },
            $inc: { playerNumber: 1 }
        }, { 
            new: true,
            useFindAndModify: false
         }, function(err, updatedgame) {
            if(err) console.error(err); 

            if(updatedgame) {
                updatedgame.save(function(err) {
                    if(err) console.error(err); 

                    newplayer.save(function(err) {
                        if(err) console.error(err); 
  
                        io.emit('joining game', updatedgame); 
                    }); 
                });
            } else {
                io.emit('no game found', player_ID); 
            }
        });
    }); 

    // when client host enters START
    socket.on('start game', function(clientInfo) {

        console.log("START GAME"); 
        let game_ID = clientInfo[0]; 

        // find the relevant game, which contains players 
        Game.find({'gameID': game_ID}, function(err, gamefound) {
            if(err) console.error(err);
            gamefound = gamefound[0]; 
            console.log("game found: " + gamefound); 

            // set player opponent to be the next player in the list
            // each player has a unique opponent 
            let players = [];
            setPlayerOpponents(gamefound, 0, players, game_ID); 
        }); 
    }); 

    // when client enters a command
    socket.on('player command', function(clientInfo) {
        
        let input = clientInfo[0];
        let game_ID = clientInfo[1]; 
        let player_ID = clientInfo[2]; 

        console.log('input from client: ', input);
        
        // seperate command and paramater - e.g. "GOTO ADMIN" 
        input = input.split(" ");
        let command = input[0]; 
        let parameter = input[1]; 

        // looks at the command defined in the global variables 
        switch(command) {
            case commands.command0: 
                commandHelp(player_ID, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]);
                });
                break; 
            case commands.command1:
                commandList(game_ID, player_ID, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                }); 
                break; 
            case commands.command2:
                commandGoto(game_ID, player_ID, parameter, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                }); 
                break; 
            case commands.command3:
                commandOpen(game_ID, player_ID, parameter, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]);  
                }); 
                break;
            case "SHOW":
                commandShow(game_ID, player_ID, parameter, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                });  
                break; 
            case "KILL": 
                console.log("player entered KILL"); 
                commandKillcode(game_ID, player_ID, parameter, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                }); 
                break;
            default: 
                getPlayer(player_ID, function(playerfound) {
                    let currentRoom = playerfound.room;
                    let output = ["INPUTERROR > COMMAND NOT FOUND: " + parameter];
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]);
                });
                break; 
        }
    }); 
    
    // after user tries to enter admin folder and has entered the correct password 
    socket.on('authorizing', function(clientInfo) {
            
        let input = clientInfo[0];
        let game_ID = clientInfo[1]; 
        let player_ID = clientInfo[2];
    
        // get player from db by ID
        getPlayer(player_ID, function(playerfound) {
            let authorized; 
        
            if(input == playerfound.opponentPassword) authorized = true; 
            else authorized = false;
        
            // if player has entered correct password - send player to admin
            io.emit('authorized', [authorized, game_ID, player_ID]);
        }); 
    }); 

    // if player is inside chatroom and sends message 
    socket.on('sendmessage', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        // find the player that sends the message and emit to all other players
        getPlayer(player_ID, function(playerfound) {
            io.emit('receivemessage', [input, game_ID, player_ID, playerfound.username]);  
        });
    });

    // when player enters KILL SYSTEM 
    socket.on('killsystem', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];
        let phase = clientInfo[3]; 
        
        console.log("phase: " + phase); 
        console.log("kill system - player input: " + input);
        
        getPlayer(player_ID, function(playerfound) { 
            
            console.log(playerfound.opponent);
            console.log(playerfound.opponentPassword);
            console.log(input.toLowerCase());
             
            // there are 5 phases in the kill system procedure - with 5 different passwords
            switch(phase) {
                case 0: 
                    if(input == playerfound.opponent) {
                        console.log("true");
                        playerfound.killcode[phase] = true;
                    } 
                    break; 
                case 1: 
                    if(input == playerfound.opponentPassword) {
                        console.log("true");
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 2: 
                    if(input.toLowerCase() == "penny") {
                        console.log("true");
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 3: 
                    if(input.toLowerCase() == "nevermind") {
                        console.log("true");
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 4: 
                    if(input == "19031307") {
                        console.log("true");
                        playerfound.killcode[phase] = true;
                    } 
                    break;
            }

            Player.findOneAndUpdate({ 'playerID': player_ID }, {
                killcode: playerfound.killcode 
            }, { 
                new: true,
                useFindAndModify: false
            }, function(err, updatedPlayer) {
                if(err) console.error(err); 
            
                if(updatedPlayer) {
                    updatedPlayer.save(function(err) {
                        if(err) console.error(err); 

                        let currentRoom = playerfound.room; 

                        console.log(playerfound.killcode); 
                
                        io.emit('systemshutdown', [playerfound.killcode, game_ID, player_ID, currentRoom, playerfound.username]); 
                    });
                }
            });
        });
    });

    // when the game is finished
    socket.on('finished', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        getPlayer(player_ID, function(playerfound) {
            io.emit('end game', [input, game_ID, player_ID, playerfound.username, playerfound.opponent]);  
        });
    });
    
    // when a user disconnects 
    socket.on('disconnect', function() {
        console.log('user disconnected: ', socket.id); 

        // remove the user socket id from the array 
        for(let i=0; i<sockets.length; i++) {
            if(sockets[i] == socket.id) sockets.splice(i, 1); 
        }
    });
}); 




// *** THE FOLLOWING FUNCTIONS SHOULD BE MOVED TO SEPERATE FILES ***

// loops through all players in the given game and assigns opponents, equal to the next player in the list 
// this is a recursive function that runs until all players have been assigned an opponent 
function setPlayerOpponents(gamefound, index, players, game_ID) {

    // when the recursive function reaches the terminate state - begin the game
    if(index == gamefound.players.length) beginGame(game_ID, players); 
    else {
        let i = index; 

        // create a promise object that resolves once the player has been assigned an opponent 
        // it then moves on to the next player in the list 
        let promise = new Promise(function(resolve, reject) {

            let player_ID = gamefound.players[i]; 

            // do some updates to the player, then jump to next iteration 
            Player.find({'playerID': player_ID}, function(err, playerfound) {
                if(err) console.error(err); 
                playerfound = playerfound[0]; 

                // player opponent is next player in list, the last player gets the first player as opponent
                let opponent_ID = (i == gamefound.players.length-1) ? gamefound.players[0] : gamefound.players[i+1]; 
                
                Player.find({'playerID': opponent_ID}, function(err, opponentfound) {
                    if(err) console.error(err); 

                    if(!opponentfound[0]) reject("No player found!"); 

                    opponentfound = opponentfound[0];                    
                    playerfound.opponent = opponentfound.username; 
                    playerfound.opponentPassword = opponentfound.password; 
                    playerfound.hiddenFiles = false; 
                    
                    playerfound.save(function(err) {
                        if(err) console.error(err); 
                        players.push(playerfound); 

                        // once the player opponent has been updated - resolve and move to next player 
                        resolve(players); 
                    });
                }); 
            });
        });
        
        promise.then(
            result => {
                i++;
                setPlayerOpponents(gamefound, i, result, game_ID); 
                return players; 
            },
            error => {
                console.log(error); 
            }
        );   
    }
}

// initiate the game with some introduction text  
function beginGame(game_ID, players) {

    var txts1 = [
        "ACCESSING SYSTEM...",
        "HELLO [NAME] HOW ARE YOU",
        "WOULD Y@U *! L?K3 T0 *£..$..",
        "...¤¤¤..@..?...*#..!........."
    ];
    
    var txts2 = [
        " ",
        "!!! ...WARNING... !!!",
        "A HOSTILE ENTITY IS TRYING TO ACCESS YOUR SYSTEM...",
        "!!! ...WARNING... !!!",
        "FIND THE KILLCODE FOR THE HOSTILE SYSTEM",
        "LOOK THROUGH THE FILES IN THE HOSTILE SYSTEM",
        "THE KILLCODE WILL SHUT DOWN THE HOSTILE SYSTEM...",
        "...FIND IT BEFORE THEY FIND YOURS...",
        "..........",
        "HACKING HOSTILE SYSTEM... INITIATED",
        "..........",
        "HACKING COMPLETED SUCCESSFULLY!",
        "ACCESS GRANTED..."
    ]; 
    
    var txts3 = [
        " ",
        "HELLO [OPPONENT] HOW ARE YOU",
        "FOR HELP NAVIGATING THE SYSTEM TYPE 'HELP'",
    ]; 
    
    io.emit('starting game', [game_ID, txts1, txts2, txts3, players]); 
}

// generate a random unique id for each game
function generateGameID(saveNewGame) {
    
    var newGameID = ""; 
    var existingGameID = ""; 
    var duplicates = true; 
    
    Game.find(function(err, gamesfound) {
        if(err) {
            console.error(err);
            return null; 
        } 

        // ensure the game id does not exist in the db already 
        while(duplicates) {
            
            newGameID = Math.floor(Math.random() * 10000);
            let duplicateFound = false; 

            for(let i=0; i<gamesfound.length; i++) {
                existingGameID = gamesfound[i].gameID; 
                if(existingGameID == newGameID) {
                    duplicateFound = true; 
                    break; 
                }
            }

            if(!duplicateFound) duplicates = false; 
        }
        saveNewGame(newGameID);  
    });
}     

// returns the player based on the ID
function getPlayer(player_ID, foundPlayer) {

    Player.find({'playerID': player_ID}, function(err, playerfound) {
        if(err) console.error(err);
        playerfound = playerfound[0]; 

        foundPlayer(playerfound); 
    }); 
} 
    
// if the player enters the command HELP
// outputs an array of text help instructions 
function commandHelp(player_ID, executeCommand) {

    getPlayer(player_ID, function(playerfound) {
        let currentRoom = playerfound.room;

        let output = ['Here is a list of commands:',
                    '----------------------',
                    '| - - - command - - -|  - - function - - |',
                    '| ' + commands.command1 + ' - - - - - - - | list content of folder |',
                    '| ' + commands.command2 + ' [folder name] | move to folder |',
                    '| ' + commands.command2 + ' [..] - - - - -| go back |',
                    '| ' + commands.command3 + ' [file name] - | open/run file |',
                    '----------------------'
        ];

        executeCommand(output, currentRoom);
    }); 
    return 
}

// if the player enters the command GOTO
function commandGoto(game_ID, player_ID, parameter, executeCommand) {

        getPlayer(player_ID, function(playerfound) {

            var currentPlayer = playerfound; 
            var currentRoom = currentPlayer.room;
            var newRoom = null;
            
            // if the user wishes to go back 
            if(parameter == "..") {
                
                Room.find({'name': currentRoom}, function(err, roomfound) {
                    if(err) console.error(err);

                    // set new room to the previous room 
                    newRoom = roomfound[0].prevRoom; 
                    
                    Player.findOneAndUpdate({ 'playerID': player_ID }, {
                        room: newRoom 
                    }, { 
                        new: true,
                        useFindAndModify: false
                    }, function(err, updatedPlayer) {
                        if(err) console.error(err); 
                    
                        if(updatedPlayer) {
                            updatedPlayer.save(function(err) {
                                if(err) console.error(err); 

                                currentRoom = newRoom; 
                                newRoom = "CHANGED FOLDER";
                                executeCommand([newRoom], currentRoom);
                                return; 
                            });
                        }
                    }); 
                }); 
            
            // if the user types a room to go to 
            } else {
                var roomToGo = parameter.toLowerCase();
                
                // if players wishes to enter admin folder - they need to type password 
                if(roomToGo == "admin" && currentRoom == "/root/users") {
                    newRoom = "ENTER PASSWORD"; 
                    executeCommand([newRoom], currentRoom);
                    return; 

                // if the player typed the correct password - they get access to the admin folder 
                } else if(roomToGo == "auth") {
                    roomToGo = "admin"; 
                }
                
                roomToGo = currentRoom + "/" + roomToGo; 
                
                Room.find({ 'name': roomToGo }, function(err, roomfound) {
                    if(err) console.error(err);
                    roomfound = roomfound[0]; 
                    
                    // if the desired room exists - update player room 
                    if(roomfound) {
                        newRoom = roomfound.name; 

                        Player.findOneAndUpdate({ 'playerID': player_ID }, {
                            room: newRoom, 
                        }, { 
                            new: true,
                            useFindAndModify: false
                        }, function(err, updatedPlayer) {
                            if(err) console.error(err); 
                            
                            if(updatedPlayer) {
                                updatedPlayer.save(function(err) {
                                    if(err) console.error(err); 

                                    currentRoom = newRoom; 
                                    newRoom = "CHANGED FOLDER";
                                    executeCommand([newRoom], currentRoom);
                                    return;
                                });
                            // if something goes wrong with updating the player room 
                            } else {
                                newRoom = "COULD NOT FIND DIRECTORY";
                                executeCommand([newRoom], currentRoom);
                                return;
                            }
                        }); 
                    
                    // if the desired room does not exist
                    } else {
                        newRoom = "COULD NOT FIND DIRECTORY";
                        executeCommand([newRoom], currentRoom);
                        return;
                    }
                });
            }
        });
}

// if the player enters the command LIST
function commandList(game_ID, player_ID, executeCommand) {

    getPlayer(player_ID, function(playerfound) {

        var currentPlayer = playerfound; 
        var currentRoom = currentPlayer.room;
        var folders = []; 
        var items = []; 
        
        Room.find({'name': currentRoom}, function(err, roomfound) {
            if(err) console.error(err);
            roomfound = roomfound[0]; 
            
            // look a the nextrooms of the current room 
            for(let i=0; i<roomfound.nextRooms.length; i++) {

                // put <dir> in front of all room/folder names 
                let r = roomfound.nextRooms[i];
                    r = r.split("/"); 
                    r = r[r.length-1]; 
                    r = "<dir> " + r; 
                    folders[i] = r;
            }

            // look through each items in the current room
            for(let j=0; j<roomfound.items.length; j++) {
                let it = roomfound.items[j];

                // if file is the hidden file, and the player has permission to view 
                if(it == "some files are hidden" && currentPlayer.hiddenFiles) {
                    it = "diary.txt"; 
                }

                // put <file> in front of all items/files
                it = "<file> " + it; 
                items[j] = it;
            }

            // concatenate the rooms and items 
            var list = folders.concat(items);
            executeCommand(list, currentRoom);
        });
    }); 
}

// if a player enters the command OPEN
function commandOpen(game_ID, player_ID, parameter, executeCommand) {

    getPlayer(player_ID, function(playerfound) {

        var currentPlayer = playerfound; 
        var currentRoom = currentPlayer.room;        
        var file = null; 
        
        Room.find({'name': currentRoom}, function(err, roomfound) {
            if(err) console.error(err);
            
            // look through each items in the current room to find the desired file/item
            for(let i=0; i<roomfound[0].items.length; i++) {

                if(parameter.toLowerCase() == "diary.txt") {
                    file = "diary.txt"; 
                } else if(roomfound[0].items[i].toLowerCase() == parameter.toLowerCase()) {
                    
                    file = roomfound[0].items[i];

                    // if the desired file/item is database, edit it by exchanging the opponent username and password
                    if(file == "database.txt") { editFile(file, currentPlayer); }
                    break; 
                }
            }
            executeCommand([(file) ? "OPENING " + parameter : "NO SUCH FILE"], currentRoom); 
        });
    }); 
}

// edit the given file by exchanging the username and password 
function editFile(file, currentPlayer) {

    let fs = require('fs');

    // read the given file 
    fs.readFile('./public/files/' + file, 'utf-8', function(err, data){
        if (err) throw err;
    
        // change username and password to correct values 
        let username = currentPlayer.opponent;
        let password = currentPlayer.opponentPassword; 
        data = data.replace('[USER]', username);
        data = data.replace('[PASS]', password);
    
        // write/return the new changed file 
        fs.writeFile('./public/files/' + file, data, 'utf-8', function (err) {
          if (err) throw err;
        });
    });
}

// if the player enters the command SHOW
function commandShow(game_ID, player_ID, parameter, executeCommand) {

    getPlayer(player_ID, function(playerfound) {

        let currentPlayer = playerfound; 
        let currentRoom = currentPlayer.room; 
        var output; 

        // if the player stands in the admin folder 
        if(currentRoom == "/root/users/admin") {
            
            // I made it possible to easily add other admin commands
            switch(parameter) {

                case "HIDDEN-FILES":
                    Player.findOneAndUpdate({ 'playerID': player_ID }, {
                        hiddenFiles: true 
                    }, { 
                        new: true,
                        useFindAndModify: false
                    }, function(err, updatedPlayer) {
                        if(err) console.error(err); 
            
                        if(updatedPlayer) {
                            updatedPlayer.save(function(err) {
                                if(err) console.error(err); 

                                output = "SHOWING " + parameter; 
                            });
                        }
                    }); 
                break;

                // if player enters a wrong admin command
                default:
                    output = "INPUTERROR > COMMAND NOT FOUND: " + parameter;
                    break;
            }
        // if player is not standing in the admin folder 
        } else {
            output = "YOU NEED ADMIN PERMISSION FOR THIS ACTION"; 
        }
        executeCommand([output], currentRoom); 
    });
}

// if the player enters the command KILL SYSTEM 
function commandKillcode(game_ID, player_ID, parameter, executeCommand) {

    getPlayer(player_ID, function(playerfound) {

        let currentRoom = playerfound.room; 
        let output = null; 

        if(currentRoom == "/root") {
            if(parameter == "SYSTEM") {
                output = "SYSTEM SHUTDOWN";

            // if the player is not standing in the root 
            } else {
                output = "CANNOT KILL THAT, I CAN ONLY KILL THE SYSTEM"; 
            }
        }
        executeCommand([(output) ? output : "READ THE INSTRUCTIONS MORE CAREFULLY"], currentRoom); 
    }); 
}