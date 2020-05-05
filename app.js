const express = require('express');
const app = express(); 
var http = require('http').createServer(app);
// const http = require('http');
const io = require('socket.io')(http); 
const path = require('path');
const mongoose = require('mongoose');

const databasesetup = require('./server_scripts/databasesetup'); 

const port = process.env.PORT || 3000

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/html');
//   res.end('<h1>Hello World</h1>');
// });

http.listen(port, function() {
    console.log('listening on : ' + port); 
}); 

// server.listen(port,() => {
//   console.log(`Server running at port `+port);
// });

// SET DEFAULT FOLDER TO PUBLIC
app.use(express.static(path.join(__dirname, 'public')));





// URL of mLab mongo database 
var mongoDB = 'mongodb://olini16:hacking-game2020@ds161112.mlab.com:61112/hacking-game';
// var mongoDB = 'mongodb://localhost/test'; 

// connect to mongodb 
mongoose.connect(mongoDB, { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
// mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// schemas
var Room, Game, Player;

db.once('open', function() {
    console.log("YES!");
    
    Game = databasesetup.initGameSchema(); 
    Room = databasesetup.initRoomSchema();
    Player = databasesetup.initPlayerchema();  
    
});



//this should be stored in database 
var sockets = []; 
// var gamemanager = {
//     playerNumber: 0,
//     players: []
// };
var commands = {
    command0: "HELP",
    command1: "LIST", 
    command2: "GOTO",
    command3: "OPEN"
};


// var games = [];
/*  structure of games array
    games = [
        gamemanager = {
            gameID: 'H53JDK356E',
            playerNumber: 2,
            players: [
                player = {
                    username: olini16,
                    password: cats,
                    playerID: AT64JT72FMX
                    room: '/root',
                    opponent: 'thebigdude',
                    opponentPassword: 'abc123',
                    hiddenFiles: false,
                    killcode: [
                        false, 
                        false, 
                        false, 
                        false,
                        false
                    ]
                },
                player = {
                    username: thebigdude,
                    password: abc123,
                    playerID: JESJT462SD5,
                    room: '/root/admin',
                    opponent: 'olini16',
                    opponentPassword: 'cats',
                    hiddenFiles: false,
                }
            ]
        },
        gamemanager = {
            gameID: 'PCD24DJK23',
            ...
        }
    ]
*/



// GET HOMEPAGE
app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html'); 
    // res.redirect(__dirname + '/views/index.html'); 
}); 






// ON SOCKET CONNECTION
io.on('connection', function(socket){
    
    // databasesetup.initRooms(); 
//    gamemanager.playerNumber++; 
//    console.log('Player ' + gamemanager.playerNumber +' joined the game');
    
//    player.playerID++;  
//    gamemanager.players.push(player); 
    
    //when a new client connects to the server, print welcome message
    console.log("user connection - welcome: ", socket.id);
    console.log("current sockets: ", sockets); 
    console.log("current games online: ", Game); 
    
    console.log("welcome"); 
    
    sockets.push(socket.id); 
    
    io.emit('welcome', socket.id); 
    


    socket.on('check username', function(clientInfo) {

        let socket_ID = clientInfo[0]; 
        let username = clientInfo[1]; 

        Player.find({'username': username}, function(err, playerfound) {
            if(err) console.error(err);
            playerfound = playerfound[0]; 

            console.log("user found: " + playerfound); 

            io.emit('user check', [socket_ID, playerfound]); 
        }); 
    }); 


    socket.on('check password', function(clientInfo) {

        let socket_ID = clientInfo[0]; 
        let username = clientInfo[1];
        let password = clientInfo[2];

        Player.find({'username': username, 'password': password}, function(err, playerfound) {
            if(err) console.error(err); 
            playerfound = playerfound[0]; 

            console.log("password found: " + playerfound); 

            io.emit('pass check', [socket_ID, playerfound]); 
        }); 
    }); 
    

    
    //if the client wish to host a new game
    socket.on('host game', function(clientInfo) {
        
        console.log("player chose to host game");

        // var player = {
        //     username: clientInfo[1].username,
        //     password: clientInfo[1].password,
        //     playerID: clientInfo[0],
        //     room: '/root'
        // }; 
        // var gamemanager = {
        //     gameID: generateGameID(),
        //     playerNumber: 1,
        //     players: [
        //         player
        //     ]
        // }; 
        // games.push(gamemanager); 
        generateGameID(function(newGameID) {

            let newgame = new Game({
                gameID: newGameID, 
                playerNumber: 1,
                players: [
                    // username: clientInfo[1].username,
                    // password: clientInfo[1].password, 
                    clientInfo[0]
                    // room: '/root'
                ]
            });
            
            console.log("newgame created: ", newgame); 
            
            newgame.save(function (err) {
                if (err) console.error(err);

                let newplayer = new Player({
                    playerID: clientInfo[0],
                    username: clientInfo[1].username,
                    password: clientInfo[1].password,
                    room: '/root'
                }); 

                newplayer.save(function(err) {
                    if(err) console.error(err); 

                    console.log("new player saved, now starting game"); 
                    io.emit('hosting new game', [clientInfo[0], newgame]); 
                });

            });
        }); 
    });
    
    
    //if the client wish to join an existing game
    socket.on('join game', function(clientInfo) {
        
        let gameID = clientInfo[0]; 
        let player_ID = clientInfo[2]; 
        console.log("GAME ID FROM CLIENT: " + gameID); 
        
        let newplayer = new Player({
            playerID: player_ID,
            username: clientInfo[1].username,
            password: clientInfo[1].password,
            room: '/root'
        }); 

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
    

    //CODE TO DO...
    // WHEN USER LOGS IN 
    socket.on('find player', function(clientInfo) {

        console.log("player: " + clientInfo); 

        for(let i=0; i<games.length; i++) {
            for(let j=0; j<games[i].players.length; j++) {

                console.log("usernames in server: " + games[i].players[j].username); 

                if(games[i].players[j].username == clientInfo) {
                    
                    console.log("user found in server"); 
                    let player_ID = games[i].players[j].playerID;
                    let game_ID = games[i].gameID;  
                    games[i].players[j].room = "/root"; 
                    
                    io.emit('player found', [player_ID, game_ID]); 
                    
                    return; 
                }
            }
        }

        io.emit('player found', null); 
    });

    
    socket.on('start game', function(clientInfo) {

        console.log("START GAME"); 
        let game_ID = clientInfo[0]; 
        // let players = []; 
        // let player_ID = clientInfo[1];

        // let curGame = getGame(game_ID);
        // let curGameIndex = curGame[1]; 
        // curGame = curGame[0];  
        

        // find the relevant game, which contains players 
        Game.find({'gameID': game_ID}, function(err, gamefound) {
            if(err) console.error(err);
            gamefound = gamefound[0]; 

            console.log("game found: " + gamefound); 
            console.log("BEFORE LOOP"); 

            
            let players = [];
            setPlayerOpponents(gamefound, 0, players, game_ID); 
            
           
        }); 
    }); 

    
    //on incomming signal from client
    socket.on('player command', function(clientInfo) {
        
        let input = clientInfo[0];
        let game_ID = clientInfo[1]; 
        let player_ID = clientInfo[2]; 

        
        console.log('input: ', input);
        
        input = input.split(" "); 
        let output; 
        
        let command = input[0]; 
        let parameter = input[1]; 
    
        console.log("player input on server side: " + command + ", " + parameter); 
    
        switch(command) {
            case commands.command0: 
                commandHelp(player_ID, function(output, currentRoom) {
                    io.emit('player command', [output, game_ID, player_ID, currentRoom]);
                });
                break; 
            case commands.command1:
                commandList(game_ID, player_ID, function(output, currentRoom) {
                    // getGame(game_ID, function(currentGame) {

                        console.log("CURRENT GAME - command: ", currentRoom); 
                        // let player = getPlayer()
                        console.log("output: " + output); 
                        //emit action based on player command to client
                        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                    // }); 
                }); 
                break; 
            case commands.command2:
                commandGoto(game_ID, player_ID, parameter, function(output, currentRoom) {
                    // getGame(game_ID, function(currentGame) {

                        console.log("CURRENT GAME - command: ", currentRoom); 
                        // let currentRoom = getPlayerRoom(currentGame, player_ID); 
                        console.log("output: " + output); 
                        //emit action based on player command to client
                        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                    // }); 
                }); 
                break; 
            case commands.command3:
                commandOpen(game_ID, player_ID, parameter, function(output, currentRoom) {
                    // getGame(game_ID, function(currentGame) {

                        console.log("CURRENT GAME - command: ", currentRoom); 
                        // let currentRoom = getPlayerRoom(currentGame, player_ID); 
                        console.log("output: " + output); 
                        //emit action based on player command to client
                        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                    // }); 
                }); 
                break;
            case "SHOW":
                commandShow(game_ID, player_ID, parameter, function(output, currentRoom) {
                    // getGame(game_ID, function(currentGame) {

                        console.log("CURRENT GAME - command: ", currentRoom); 
                        // let currentRoom = getPlayerRoom(currentGame, player_ID); 
                        console.log("output: " + output); 
                        //emit action based on player command to client
                        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                    // }); 
                });  
                break; 
            case "KILL": 
                console.log("player entered KILL"); 
                commandKillcode(game_ID, player_ID, parameter, function(output, currentRoom) {
                    // getGame(game_ID, function(currentGame) {

                        console.log("CURRENT GAME - command: ", currentRoom); 
                        // let currentRoom = getPlayerRoom(currentGame, player_ID); 
                        console.log("output: " + output); 
                        //emit action based on player command to client
                        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
                    // });
                }); 
                break; 
        }
        
        
    }); 
    
    //on incomming signal from client
    socket.on('authorizing', function(clientInfo) {
            
        let input = clientInfo[0];
        let game_ID = clientInfo[1]; 
        let player_ID = clientInfo[2];
    
        getPlayer(player_ID, function(playerfound) {
            // let player = getPlayer(gamefound[0], player_ID); 
        
            let authorized; 
        
            console.log("authorizing: " + input + " == " + playerfound.opponentPassword); 
            if(input == playerfound.opponentPassword) authorized = true; 
            else authorized = false;
        
            io.emit('authorized', [authorized, game_ID, player_ID]);
        }); 
    }); 


    socket.on('sendmessage', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        getPlayer(player_ID, function(playerfound) {
            // let player = getPlayer(gamefound[0], player_ID);
            
            io.emit('receivemessage', [input, game_ID, player_ID, playerfound.username]);  
        });
    });


    socket.on('killsystem', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];
        let phase = clientInfo[3]; 
        
        console.log("kill system - player input: " + input); 
        console.log("phase: " + phase); 

        getPlayer(player_ID, function(playerfound) { 
            // let player = getPlayer(gamefound[0], player_ID); 

            switch(phase) {
                case 0: 
                    if(input == playerfound.opponent) {
                        playerfound.killcode[phase] = true;
                    } 
                    break; 
                case 1: 
                    if(input == playerfound.opponentPassword) {
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 2: 
                    if(input.toLowerCase() == "penny") {
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 3: 
                    if(input.toLowerCase() == "nevermind") {
                        playerfound.killcode[phase] = true;
                    } 
                    break;
                case 4: 
                    if(input == "19031307") {
                        playerfound.killcode[phase] = true;
                    } 
                    break;
            }

            playerfound.save(function(err) {
                if(err) console.error(err); 
                
                // let currentGame = getGame(game_ID); 
                let currentRoom = playerfound.room; 
                
                io.emit('systemshutdown', [playerfound.killcode, game_ID, player_ID, currentRoom, playerfound.username]); 
            });
        });
    });

    socket.on('finished', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        getPlayer(player_ID, function(playerfound) {

            // let player = getPlayer(gamefound[0], player_ID);
            
            io.emit('end game', [input, game_ID, player_ID, playerfound.username, playerfound.opponent]);  
        });
    });
    
    //when a user disconnects 
    socket.on('disconnect', function() {
        console.log('user disconnected: ', socket.id); 

        for(let i=0; i<sockets.length; i++) {
            if(sockets[i] == socket.id) sockets.splice(i, 1); 
        }
    });
}); 



function setPlayerOpponents(gamefound, index, players, game_ID) {

    if(index == gamefound.players.length) beginGame(game_ID, players); 
    else {

        // let players = []; 
        // for(var i=0; i<gamefound.players.length; i++) {
        let i = index; 
        
        let promise = new Promise(function(resolve, reject) {
            // executor (the producing code, "singer")
        

            // loop through each player in the game
            // for(let i=0; i<gamefound.players.length; i++) {
            let player_ID = gamefound.players[i]; 
            console.log("playerID: " + player_ID);

            
            // do some updates to the player, then jump to next iteration 
            Player.find({'playerID': player_ID}, function(err, playerfound) {
                if(err) console.error(err); 
                playerfound = playerfound[0]; 

                // players.push(playerfound); 
                console.log("player found: " + playerfound); 
                
                let opponent_ID = (i == gamefound.players.length-1) ? gamefound.players[0] : gamefound.players[i+1]; 
                console.log("opponentID: " + opponent_ID); 
                
                Player.find({'playerID': opponent_ID}, function(err, opponentfound) {
                    if(err) console.error(err); 
                    if(!opponentfound[0]) reject("No player found!"); 
                    opponentfound = opponentfound[0];
                    console.log("opponent found: " + opponentfound);  
                    
                    playerfound.opponent = opponentfound.username; 
                    playerfound.opponentPassword = opponentfound.password; 
                    playerfound.hiddenFiles = false; 
                    
                    playerfound.save(function(err) {
                        if(err) console.error(err); 
                        console.log("player saved: " + playerfound);
                        players.push(playerfound); 

                        resolve(players); 
                    });
                }); 

                // playerfound[0].opponent = (i == gamefound.players.length-1) ? playerfound[0].username : gamefound.players[i+1].username;
                // gamefound.players[i].opponentPassword = (i == gamefound.players.length-1) ? gamefound.players[0].password : gamefound.players[i+1].password;
                
                // // set player authorization to false
                // gamefound.players[i].hiddenFiles = false;
                // // gamefound.players[i].killcode = [false, false, false, false, false];    

            });
        
        // }
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
            // }   
    }
}


function beginGame(game_ID, players) {
    console.log("AFTER LOOP"); 


    var txts1 = [
        // "BOOT UP COMPLETE",
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

    // });
}

    

// GENERATE A RANDOM UNIQUE GAME ID
function generateGameID(saveNewGame) {
    
    var newGameID = ""; 
    var existingGameID = ""; 
    var duplicates = true; 
    
    Game.find(function(err, gamesfound) {
        if(err) {
            console.error(err);
            return null; 
        } 
        
        console.log("gamesfound: " + gamesfound); 

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
    
    
// returns a specific game object + the index of the game
// based on the game ID in the parameter 
function getGame(ID, foundGame) {
    
    Game.find({'gameID': ID}, function(err, gamefound) {
        if(err) console.error(err);

        gamefound = gamefound[0];
        
        foundGame(gamefound); 
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
    

// THESE FUNCTIONS SHOULD BE MOVED TO THEIR OWN FILES
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

function commandGoto(game_ID, player_ID, parameter, executeCommand) {

    // var currentGameInfo = getCurrentGameInfo(game_ID, player_ID); 
    // getGame(game_ID, function(gamefound) {

        // console.log("CURRENT GAME INFO: ", currentGameInfo); 
        // var currentGame = gamefound;
        // console.log("CURRENT GAME - GOTO: ", currentGame); 
        getPlayer(player_ID, function(playerfound) {

            var currentPlayer = playerfound; 
            console.log("CURRENT PLAYER - GOTO: ", currentPlayer); 
            var currentRoom = currentPlayer.room;
            
            var newRoom = null;
            
            // if user typed ".." then go back to previous room 
            if(parameter == "..") {
                
                Room.find({'name': currentRoom}, function(err, roomfound) {
                    if(err) console.error(err);
                    console.log("ROOM FOUND [..] - GOTO: " + roomfound); 
                    newRoom = roomfound[0].prevRoom; 
                    // if(preRoom) newRoom = preRoom;
                    
                    
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
                                
                                console.log("success go back"); 
                                currentRoom = newRoom; 
                                newRoom = "CHANGED FOLDER";
                                
                                executeCommand([newRoom], currentRoom);
                                return; 
                            });
                        }
                    }); 
                }); 
            
            } else {
            
                console.log("user wishes to move to: "); 
                var roomToGo = parameter.toLowerCase();
                
                console.log(roomToGo); 
                
                if(roomToGo == "admin" && currentRoom == "/root/users") {
                    
                    newRoom = "ENTER PASSWORD";
                    console.log("success try to go to admin"); 
                    executeCommand([newRoom], currentRoom);
                    return; 

                } else if(roomToGo == "auth") {
                    
                    console.log("success admin authorized"); 
                    roomToGo = "admin"; 
                }
                
                roomToGo = currentRoom + "/" + roomToGo; 
                
                // console.log("ROOM TO GO: " + roomToGo); 

                
                console.log("currentroom: " + currentRoom); 
                console.log("roomtogo: " + roomToGo); 
            
            
            
                Room.find({ 'name': roomToGo }, function(err, roomfound) {
                    if(err) console.error(err);
                    roomfound = roomfound[0]; 
                    
                    console.log("roomfound: " + roomfound);
                    
                    if(roomfound) {
                        
                        newRoom = roomfound.name; 
                        console.log("room exists: " + newRoom); 

                        console.log("gameID: " + game_ID); 
                        console.log("playerID: " + player_ID); 
                        console.log("room: " + newRoom); 
                        // console.log("currentGame: " + currentGame); 
                        
                        Player.findOneAndUpdate({ 'playerID': player_ID }, {
                            room: newRoom, 
                        }, { 
                            new: true,
                            useFindAndModify: false
                        }, function(err, updatedPlayer) {
                            if(err) console.error(err); 
                            
                            console.log("found something: " + updatedPlayer); 
                            
                            if(updatedPlayer) {
                                console.log("updated game exists"); 
                                updatedPlayer.save(function(err) {
                                    if(err) console.error(err); 

                                    console.log("success update game to wishes room ", updatedPlayer); 
                                    currentRoom = newRoom; 
                                    newRoom = "CHANGED FOLDER";
                                    executeCommand([newRoom], currentRoom);
                                    return;
                                });
                            } else {
                                console.log("no game found, not updated");
                                newRoom = "COULD NOT FIND DIRECTORY";
                                executeCommand([newRoom], currentRoom);
                                return;
                            }
                        }); 
                        
                    } else {

                        console.log("no room exists"); 
                        newRoom = "COULD NOT FIND DIRECTORY";
                        executeCommand([newRoom], currentRoom);
                        return;
                    }

                });
            
            }
        
        });
    // }); 
    
}
                
// let nextRoomIndex = roomfound[0].nextRooms.indexOf(roomToGo); 

                // console.log("ROOM FOUND [..] - GOTO: " + roomToGo);  
                // newRoom = roomToGo;







            
    //         if(!newRoom) {

    //             console.log("currentroom: " + currentRoom); 
    //             console.log("roomtogo: " + roomToGo); 

    //             Room.find({'name': currentRoom, 'nextRooms': roomToGo}, function(err, roomfound) {
    //                 if(err) console.error(err);

    //                 console.log("hej: " + roomfound[0]);
    //                 console.log("lol: ", roomfound[0]);
    //                 console.log(typeof roomfound[0]);
    //                 console.log(roomfound[0].nextRooms);
    //                 console.log(typeof roomfound[0].nextRooms);
                    
    //                 let nextRoomIndex = roomfound[0].nextRooms.indexOf(roomToGo); 
    //                 roomToGo = roomfound[0].nextRooms[nextRoomIndex]; 

    //                 console.log("ROOM FOUND [..] - GOTO: " + roomToGo);  
    //                 newRoom = roomToGo;



    //                 Game.findOneAndUpdate({ 'gameID': game_ID, 'playerID': player_ID }, {
    //                     room: newRoom 
    //                 }, { 
    //                     new: true,
    //                     useFindAndModify: false
    //                  }, function(err, updatedgame) {
    //                     if(err) console.error(err); 
            
    //                     if(updatedgame) {
    //                         updatedgame.save(function(err) {
    //                             if(err) console.error(err); 
    //                             newRoom = "CHANGED FOLDER";
    //                         });
    //                     }
    //                 }); 
    //             }); 
    //         } else {
    //             newRoom = "COULD NOT FIND DIRECTORY"; 
    //         }
    //     }
        
    //     if(newRoom) { 
    //         if(newRoom != "ENTER PASSWORD") {

    //             // currentPlayer.room = newRoom; 
    //             // currentGame.players[currentGameInfo[3]]; 
    //             // games[currentGameInfo[1]] = currentGame; 

    //             Game.findOneAndUpdate({ 'gameID': game_ID, 'playerID': player_ID }, {
    //                 room: newRoom 
    //             }, { 
    //                 new: true,
    //                 useFindAndModify: false
    //              }, function(err, updatedgame) {
    //                 if(err) console.error(err); 
        
    //                 if(updatedgame) {
    //                     updatedgame.save(function(err) {
    //                         if(err) console.error(err); 
    //                         newRoom = "CHANGED FOLDER";
    //                     });
    //                 }
    //             }); 
    //         }  
    //     } else {
    //         newRoom = "COULD NOT FIND DIRECTORY"; 
    //     }
        
    //     executeCommand([newRoom]);

    // });
// }

function commandList(game_ID, player_ID, executeCommand) {

    // var currentGameInfo = getCurrentGameInfo(game_ID, player_ID); 

    // console.log("CURRENT GAME INFO: ", currentGameInfo); 
    // getGame(game_ID, function(gamefound) {

            // console.log("CURRENT GAME: ", currentGame); 
    getPlayer(player_ID, function(playerfound) {

        var currentPlayer = playerfound; 
        console.log("CURRENT PLAYER - LIST: ", currentPlayer); 
        var currentRoom = currentPlayer.room;
        
        var folders = []; 
        var items = []; 
        
        Room.find({'name': currentRoom}, function(err, roomfound) {
            if(err) console.error(err);
            roomfound = roomfound[0]; 
            
            for(let i=0; i<roomfound.nextRooms.length; i++) {
                let r = roomfound.nextRooms[i];
                    r = r.split("/"); 
                    r = r[r.length-1]; 
                    r = "<dir> " + r; 
                    folders[i] = r;
                }

                for(let j=0; j<roomfound.items.length; j++) {
                    let it = roomfound.items[j];

                    if(it == "some files are hidden" && currentPlayer.hiddenFiles) {
                    it = "diary.txt"; 
                }
                
                it = "<file> " + it; 
                items[j] = it;
            }

            var list = folders.concat(items); 

            console.log("LIST: " + list); 
            executeCommand(list, currentRoom);
        });
    }); 
        
        // for(let i=0; i<rooms.length; i++) {

            //     if(currentRoom == rooms[i].name) {

        //         for(let j=0; j<rooms[i].nextRooms.length; j++) {
            //             let r = rooms[i].nextRooms[j];
        //             r = r.split("/"); 
        //             r = r[r.length-1]; 
        //             r = "<dir> " + r; 
        //             folders[j] = r;   
        //         }
        //         for(let n=0; n<rooms[i].items.length; n++) {
        //             let it = rooms[i].items[n];
        
        //             if(it == "some files are hidden" && currentPlayer.hiddenFiles) {
        //                 it = "diary.txt"; 
        //             }
        
        //             it = "<file> " + it; 
        //             items[n] = it; 
        //         }
        //         break; 
        //     }
        // }
        
        
    // });
}



function commandOpen(game_ID, player_ID, parameter, executeCommand) {

    // var currentGameInfo = getCurrentGameInfo(game_ID, player_ID);
    // getGame(game_ID, function(gamefound) {

    // var currentGame = gamefound;
    getPlayer(player_ID, function(playerfound) {

        var currentPlayer = playerfound; 
        var currentRoom = currentPlayer.room;
        
        var file = null; 
        
        Room.find({'name': currentRoom}, function(err, roomfound) {
            if(err) console.error(err);
            
            for(let i=0; i<roomfound[0].items.length; i++) {
                if(roomfound[0].items[i].toLowerCase() == parameter.toLowerCase()) {
                    
                    file = roomfound[0].items[i];
                    if(file == "database.txt") { editFile(file, currentPlayer); }
                    break; 
                }
            }
            
            executeCommand([(file) ? "OPENING " + parameter : "NO SUCH FILE"], currentRoom); 
        });
        
    }); 
        // for(let i=0; i<rooms.length; i++) {
        //     if(rooms[i].name == currentRoom) {
                
        //         for(let j=0; j<rooms[i].items.length; j++) {

        //             if(rooms[i].items[j].toLowerCase() == parameter.toLowerCase()) {
                        
        //                 file = rooms[i].items[j]; 

        //                 if(file == "database.txt") {
        //                     editFile(file, currentPlayer); 
        //                 }

        //                 break; 
        //             }
        //         }

        //         if(parameter.toLowerCase() == "diary.txt") {
        //             file = "diary.txt"; 
        //         } 

        //         break; 
        //     }
        // }
        
         
    // });
}


function editFile(file, currentPlayer) {

    console.log("editing file"); 
    let fs = require('fs');

    fs.readFile('./public/files/' + file, 'utf-8', function(err, data){
        if (err) throw err;
    
        console.log(data); 
    
        let username = currentPlayer.opponent;
        let password = currentPlayer.opponentPassword; 
    
        console.log(username);
        console.log(password);
    
        data = data.replace('[USER]', username);
        data = data.replace('[PASS]', password);
        
        console.log(data); 
        
    
        fs.writeFile('./public/files/' + file, data, 'utf-8', function (err) {
          if (err) throw err;
          console.log('filelistAsync complete');
        });
      });
}





function commandShow(game_ID, player_ID, parameter, executeCommand) {

    // getGame(game_ID, function(gamefound) {

        // let currentGame = gamefound; 
    getPlayer(player_ID, function(playerfound) {
        let currentPlayer = playerfound; 
        let currentRoom = currentPlayer.room; 
        // let room = getPlayerRoom(currentGame, player_ID);
        
        console.log("show files - player room " + currentRoom); 
        
        var output; 
        if(currentRoom == "/root/users/admin") {
            
            switch(parameter) {
                case "HIDDEN-FILES": 
                // let gameinfo = getCurrentGameInfo(game_ID, player_ID); 
                // currentPlayer.hiddenFiles = true; 

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

                default:
                    output = "INPUTERROR > COMMAND NOT FOUND: " + parameter;
                    break;
            }
        } else {
            output = "YOU NEED ADMIN PERMISSION FOR THIS ACTION"; 
        }
        
        executeCommand([output], currentRoom); 
    });
    // });
}


function commandKillcode(game_ID, player_ID, parameter, executeCommand) {

    getPlayer(player_ID, function(playerfound) {

        let currentRoom = playerfound.room; 
        // let currentGame = gamefound;
        // let room = getPlayerRoom(currentGame, player_ID); 

        console.log("command kill code"); 

        let output = null; 
        if(currentRoom == "/root") {
            if(parameter == "SYSTEM") {
                output = "SYSTEM SHUTDOWN";
                console.log("system: " + output);
            } else {
                output = "CANNOT KILL THAT, I CAN ONLY KILL THE SYSTEM"; 
                console.log("not system: " + output);
            }
        }
        
        console.log("kill system serverside: ", output); 

        executeCommand([(output) ? output : "READ THE INSTRUCTIONS MORE CAREFULLY"], currentRoom); 
    }); 
    
}