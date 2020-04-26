var express = require('express');
var app = express(); 
var http = require('http').createServer(app);
var io = require('socket.io')(http); 
var path = require('path');

// SET DEFAULT FOLDER TO PUBLIC
app.use(express.static(path.join(__dirname, 'public')));




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
var rooms = [
    {
        name: "/root",
        accessible: true,
        nextRooms: [
            "/root/applications",
            "/root/users"
        ],
        prevRoom: "/root",
        items: [
            "README.txt"
        ]
    },
    {
        name: "/root/applications",
        accessible: true,
        nextRooms: [],
        prevRoom: "/root",
        items: [
            "musicplayer.exe",
            "chat.exe"
        ]
    },
    {
        name: "/root/users",
        accessible: true,
        nextRooms: [
            "/root/users/personal",
            "/root/users/admin"
        ],
        prevRoom: "/root",
        items: []
    },
    {
        name: "/root/users/personal",
        accessible: true,
        nextRooms: [],
        prevRoom: "/root/users",
        items: [
            "image03.jpg",
            "image07.jpg",
            "image13.jpg",
            "image19.jpg",
            "penny.jpg",
            "database.txt",
            "some files are hidden"
        ]
    },
    {
        name: "/root/users/admin",
        accessible: false,
        nextRooms: [],
        prevRoom: "/root/users",
        items: [
            "system-settings.txt"
        ]
    }
];

var games = [];
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
    // res.sendFile(__dirname + '/views/index.html'); 
    res.redirect(__dirname + '/views/index.html'); 
}); 






// ON SOCKET CONNECTION
io.on('connection', function(socket){
    
//    gamemanager.playerNumber++; 
//    console.log('Player ' + gamemanager.playerNumber +' joined the game');
    
//    player.playerID++;  
//    gamemanager.players.push(player); 
    
    //when a new client connects to the server, print welcome message
    console.log("user connection - welcome: ", socket.id);
    console.log("current sockets: ", sockets); 
    console.log("current games online: ", games); 
    
    console.log("welcome"); 
    
    sockets.push(socket.id); 
    
    io.emit('welcome', socket.id); 
    
    
    
    //if the client wish to host a new game
    socket.on('host game', function(clientInfo) {
        
        console.log("player chose to host game");

        var player = {
            username: clientInfo[1].username,
            password: clientInfo[1].password,
            playerID: clientInfo[0],
            room: '/root'
        }; 
        var gamemanager = {
            gameID: generateGameID(),
            playerNumber: 1,
            players: [
                player
            ]
        }; 
        games.push(gamemanager); 
        
        io.emit('hosting new game', [clientInfo[0], gamemanager]); 
    });
    
    
    //if the client wish to join an existing game
    socket.on('join game', function(clientInfo) {
        
        var gameID = clientInfo[0]; 
        console.log("GAME ID FROM CLIENT: " + gameID); 
        
        var game = getGame(gameID);
        console.log("GAME FOUND WITH GAME ID: ", game); 
        
        if(game) {
            var player = {
                username: clientInfo[1].username,
                password: clientInfo[1].password,
                playerID: clientInfo[2],
                room: '/root'
            }; 

            updateGame(game[1], player); 
            console.log("GAMES IS UPDATED: ", games); 
            
            io.emit('joining game', game[0]); 
        } else {
            io.emit('no game found', clientInfo[2]); 
        }
    }); 


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
        let player_ID = clientInfo[1];

        let curGame = getGame(game_ID);
        let curGameIndex = curGame[1]; 
        curGame = curGame[0];  
        console.log("CURRENT GAME: ", curGame); 

        // find the current player
        // update players opponent to be the next player in the list
        // if current player is the last, then opponent is the first in the list
        for(let i=0; i<curGame.players.length; i++) {

            curGame.players[i].opponent = (i == curGame.players.length-1) ? curGame.players[0].username : curGame.players[i+1].username;
            curGame.players[i].opponentPassword = (i == curGame.players.length-1) ? curGame.players[0].password : curGame.players[i+1].password;

            // set player authorization to false
            curGame.players[i].hiddenFiles = false;
            curGame.players[i].killcode = [false, false, false, false, false];    
        }

        // update the game with the player with opponent
        games[curGameIndex] = curGame; 
        
        console.log("GAME UPDATED: ", games[curGameIndex]); 

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

        io.emit('starting game', [game_ID, txts1, txts2, txts3, curGame]); 
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
                output = commandHelp();
                break; 
            case commands.command1:
                output = commandList(game_ID, player_ID); 
                break; 
            case commands.command2:
                output = commandGoto(game_ID, player_ID, parameter); 
                break; 
            case commands.command3:
                output = commandOpen(game_ID, player_ID, parameter); 
                break;
            case "SHOW":
                output = commandShow(game_ID, player_ID, parameter);  
                break; 
            case "KILL": 
                console.log("player entered KILL"); 
                output = commandKillcode(game_ID, player_ID, parameter); 
                break; 
        }
        
        let currentGame = getGame(game_ID); 
        console.log("CURRENT GAME: ", currentGame); 
        let currentRoom = getPlayerRoom(currentGame[0], player_ID); 
        
        //emit action based on player command to client
        io.emit('player command', [output, game_ID, player_ID, currentRoom]); 
    }); 
    
    //on incomming signal from client
    socket.on('authorizing', function(clientInfo) {
            
        let input = clientInfo[0];
        let game_ID = clientInfo[1]; 
        let player_ID = clientInfo[2];
    
        let game = getGame(game_ID); 
        let player = getPlayer(game[0], player_ID); 
    
        let authorized; 
    
        // password is image numbers in the correct geographical order from west to east
        if(input == player.opponentPassword) authorized = true; 
        else authorized = false;
    
        io.emit('authorized', [authorized, game_ID, player_ID]);
    }); 


    socket.on('sendmessage', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        let game = getGame(game_ID);
        let player = getPlayer(game[0], player_ID);

        io.emit('receivemessage', [input, game_ID, player_ID, player.username]); 

    });


    socket.on('killsystem', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];
        let phase = clientInfo[3]; 
        
        console.log("kill system - player input: " + input); 
        console.log("phase: " + phase); 

        let game = getGame(game_ID); 
        let player = getPlayer(game[0], player_ID); 


        switch(phase) {
            case 0: 
                if(input == player.opponent) {
                    player.killcode[phase] = true;
                } 
                break; 
            case 1: 
                if(input == player.opponentPassword) {
                    player.killcode[phase] = true;
                } 
                break;
            case 2: 
                if(input.toLowerCase() == "penny") {
                    player.killcode[phase] = true;
                } 
                break;
            case 3: 
                if(input.toLowerCase() == "nevermind") {
                    player.killcode[phase] = true;
                } 
                break;
            case 4: 
                if(input == "19031307") {
                    player.killcode[phase] = true;
                } 
                break;
        }

        let currentGame = getGame(game_ID); 
        let currentRoom = getPlayerRoom(currentGame[0], player_ID);

        io.emit('systemshutdown', [player.killcode, game_ID, player_ID, currentRoom, player.username]); 

    });

    socket.on('finished', function(clientInfo) {

        let input = clientInfo[0];
        let game_ID = clientInfo[1];
        let player_ID = clientInfo[2];

        let game = getGame(game_ID);
        let player = getPlayer(game[0], player_ID);

        io.emit('end game', [input, game_ID, player_ID, player.username, player.opponent]); 

    });
    
    //when a user disconnects 
    socket.on('disconnect', function() {
        console.log('user disconnected: ', socket.id); 

        for(let i=0; i<sockets.length; i++) {
            if(sockets[i] == socket.id) sockets.splice(i, 1); 
        }
    });
}); 


    

// GENERATE A RANDOM UNIQUE GAME ID
function generateGameID() {
    
    var newGameID = ""; 
    var existingGameID = ""; 
    var duplicates = true; 
    
    while(duplicates) {
        
        newGameID = Math.floor(Math.random() * 10000);
        
        for(let i=0; i<games.length; i++) {
            existingGameID = games[i].gamemanager.gameID; 
            if(existingGameID == newGameID) {
                break; 
            }
        }
        duplicates = false; 
    }
    return newGameID; 
} 
    
    
// returns a specific game object + the index of the game
// based on the game ID in the parameter 
function getGame(ID) {
    
    for(let i=0; i<games.length; i++) {
        if(games[i].gameID == ID) {
            return [games[i], i]; 
        }
    }

    return null; 
}


// update a game by adding a player to the game defined by the index in the parameter
function updateGame(index, player) {
    
    games[index].players.push(player);
    games[index].playerNumber++;  
}
    

// returns the player based on the ID
function getPlayer(game, player_ID) {
    for(let i=0; i<game.players.length; i++) {
        if(game.players[i].playerID == player_ID) {
            return game.players[i]; 
        }
    }
} 
    

// returns the room of a player in a specific game 
function getPlayerRoom(game, player_ID) {

    console.log("GETPLAYERROOM - Game: ", game); 

    for(let i=0; i<game.players.length; i++) {
        if(game.players[i].playerID == player_ID) {
            return game.players[i].room; 
        }
    }

    return null; 
}


// THESE FUNCTIONS SHOULD BE MOVED TO THEIR OWN FILES
function commandHelp() {
    return ['Here is a list of commands:',
            '----------------------',
            '| - - - command - - -|  - - function - - |',
            '| ' + commands.command1 + ' - - - - - - - | list content of folder |',
            '| ' + commands.command2 + ' [folder name] | move to folder |',
            '| ' + commands.command2 + ' [..] - - - - -| go back |',
            '| ' + commands.command3 + ' [file name] - | open/run file |',
            '----------------------'
            ];
}

function commandGoto(game_ID, player_ID, parameter) {

    var currentGameInfo = getCurrentGameInfo(game_ID, player_ID); 
    console.log("CURRENT GAME INFO: ", currentGameInfo); 
    var currentGame = currentGameInfo[0];
    console.log("CURRENT GAME: ", currentGame); 
    var currentPlayer = currentGameInfo[2];
    console.log("CURRENT PLAYER: ", currentPlayer); 
    var currentRoom = currentPlayer.room;
    
    var newRoom = null;
    
    // if user typed ".." then go back to previous room 
    if(parameter == "..") {
        for(let i=0; i<rooms.length; i++) {
            if(currentRoom == rooms[i].name) {
                
                let preRoom = rooms[i].prevRoom;  
                
                if(preRoom) newRoom = rooms[i].prevRoom; 
            }
        }
    } else {
    
        var roomToGo = parameter.toLowerCase();
        
        if(roomToGo == "admin" && currentRoom == "/root/users") {
            newRoom = "ENTER PASSWORD";
        } else if(roomToGo == "auth") {
            roomToGo = "admin"; 
        }

        roomToGo = currentRoom + "/" + roomToGo; 
        
        if(!newRoom) {
            for(let i=0; i<rooms.length; i++) {
                if(currentRoom == rooms[i].name) {
                    for(let j=0; j<rooms[i].nextRooms.length; j++) {
                        if(roomToGo == rooms[i].nextRooms[j]) {
                            newRoom = roomToGo; 
                            break; 
                        }
                    }
                }
            } 
        }
    }
    
    if(newRoom) { 
        if(newRoom != "ENTER PASSWORD") {

            currentPlayer.room = newRoom; 
            currentGame.players[currentGameInfo[3]]; 
            games[currentGameInfo[1]] = currentGame; 
            
            newRoom = "CHANGED FOLDER"; 
        }  

    } else {
        newRoom = "COULD NOT FIND DIRECTORY"; 
    }
    
    return [newRoom];
}

function commandList(game_ID, player_ID) {

    var currentGameInfo = getCurrentGameInfo(game_ID, player_ID); 
    console.log("CURRENT GAME INFO: ", currentGameInfo); 
    var currentGame = currentGameInfo[0];
    console.log("CURRENT GAME: ", currentGame); 
    var currentPlayer = currentGameInfo[2];
    console.log("CURRENT PLAYER: ", currentPlayer); 
    var currentRoom = currentPlayer.room;

    var folders = []; 
    var items = []; 

    for(let i=0; i<rooms.length; i++) {

        if(currentRoom == rooms[i].name) {

            for(let j=0; j<rooms[i].nextRooms.length; j++) {
                let r = rooms[i].nextRooms[j];
                r = r.split("/"); 
                r = r[r.length-1]; 
                r = "<dir> " + r; 
                folders[j] = r;   
            }
            for(let n=0; n<rooms[i].items.length; n++) {
                let it = rooms[i].items[n];
                
                if(it == "some files are hidden" && currentPlayer.hiddenFiles) {
                    it = "diary.txt"; 
                }

                it = "<file> " + it; 
                items[n] = it; 
            }
            break; 
        }
    }

    var list = folders.concat(items); 

    return list;
}



function commandOpen(game_ID, player_ID, parameter) {

    var currentGameInfo = getCurrentGameInfo(game_ID, player_ID);
    var currentGame = currentGameInfo[0];
    var currentPlayer = currentGameInfo[2]; 
    var currentRoom = currentPlayer.room;

    var file = null; 

    for(let i=0; i<rooms.length; i++) {
        if(rooms[i].name == currentRoom) {
            
            for(let j=0; j<rooms[i].items.length; j++) {

                if(rooms[i].items[j].toLowerCase() == parameter.toLowerCase()) {
                    
                    file = rooms[i].items[j]; 

                    if(file == "database.txt") {
                        editFile(file, currentPlayer); 
                    }

                    break; 
                }
            }

            if(parameter.toLowerCase() == "diary.txt") {
                file = "diary.txt"; 
            } 

            break; 
        }
    }
    
    return [(file) ? "OPENING " + parameter : "NO SUCH FILE"]; 
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





function commandShow(game_ID, player_ID, parameter) {

    let game = getGame(game_ID);
    let room = getPlayerRoom(game[0], player_ID);

    console.log("show files - player room " + room); 
    
    var output; 
    if(room == "/root/users/admin") {

        switch(parameter) {
            case "HIDDEN-FILES": 
                let gameinfo = getCurrentGameInfo(game_ID, player_ID); 
                games[gameinfo[1]].players[gameinfo[3]].hiddenFiles = true; 
                output = "SHOWING " + parameter;
                break; 
            default:
                output = "INPUTERROR > COMMAND NOT FOUND: " + parameter;
                break;
        }
    } else {
        output = "YOU NEED ADMIN PERMISSION FOR THIS ACTION"; 
    }
        
    return [output]; 
}


function commandKillcode(game_ID, player_ID, parameter) {

    let game = getGame(game_ID); 
    let room = getPlayerRoom(game[0], player_ID); 

    console.log("command kill code"); 

    let output = null; 
    if(room == "/root") {
        if(parameter == "SYSTEM") {
            output = "SYSTEM SHUTDOWN";
            console.log("system: " + output);
        } else {
            output = "CANNOT KILL THAT, I CAN ONLY KILL THE SYSTEM"; 
            console.log("not system: " + output);
        }
    }
    
    console.log("kill system serverside: ", output); 

    return [(output) ? output : "READ THE INSTRUCTIONS MORE CAREFULLY"]; 
    
}


// returns an array with the following information 
// [0] = game based on gameID
// [1] = index of the game 
// [2] = current player based on playerID
// [3] = index of the player
function getCurrentGameInfo(game_ID, player_ID) {
    
    let currentGame, currentGameIndex, currentPlayer, currentPlayerInfo; 
    
    for(let i=0; i<games.length; i++) {
        if(games[i].gameID == game_ID) {
            currentGame = games[i]; 
            currentGameIndex = i; 
            break; 
        }
    }
    
    for(let j=0; j<currentGame.players.length; j++) {
        if(currentGame.players[j].playerID == player_ID) {
            currentPlayer = currentGame.players[j]; 
            currentPlayerIndex = j; 
            break; 
        }
    }

    var currentGameInfo = [currentGame, currentGameIndex, currentPlayer, currentPlayerIndex];

    return currentGameInfo; 
}












http.listen(3000, function() {
    console.log('listening on :3000'); 
}); 