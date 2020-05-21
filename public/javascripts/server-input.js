// this script handles when the server gives a response to the client
$(document).ready(function() { 
    
    // if client wish to host a new game 
    socket.on('hosting new game', function(serverInfo) {

        if(ID == serverInfo[0]) {
        
            game_ID = serverInfo[1].gameID; 
            txts[6] = txts[6] + serverInfo[1].gameID;  
            txts[7] = txts[7] + serverInfo[1].playerNumber; 
            writeTextFromScript(5, 4); 
        }
    });

    // if client wish to join a game
    socket.on('joining game', function(game) {

        game_ID = game.gameID; 
        txts[12] = txts[12] + game.playerNumber; 

        if(host) {
            writeTextFromScript(11, 4);
        } else if(!host) {
            writeTextFromScript(10, 1);
        }
        gamestate = "ready"; 
    });

    // if no game is found with the given game ID 
    socket.on('no game found', function(player_ID) {
        
        if(player_ID == ID) {
            console.log("NO GAME FOUND WITH THAT GAME ID"); 
            writeTextFromScript(16, 2); 
        }
    });

    // check if user already exists
    socket.on('user check', function(serverInfo) {
        
        let socket_ID = serverInfo[0]; 
        let player = serverInfo[1]; 
        
        if(ID == socket_ID) {
            console.log("ID match: " + player); 

            if(player) {
                writeCommandFromServer(["USER FOUND!", "ENTER PASSWORD TO CONTINUE:"]);
                newuser = false; 
            } else {
                writeCommandFromServer(["CREATE PASSWORD:"]);
                newuser = true; 
            }
        }
    });

    // check if password is correct 
    socket.on('pass check', function(serverInfo) {
        
        let socket_ID = serverInfo[0]; 
        let player = serverInfo[1]; 

        if(ID == socket_ID) {
            if(player) {
                writeCommandFromServer(["PASSWORD VERYFIED!", "NOW CONTINUING GAME...", "HELLO " + player.opponent + " HOW ARE YOU",
                "FOR HELP NAVIGATING THE SYSTEM TYPE 'HELP'"]);
                
                let room = player.room; 
                if(room == "/root/users/personal") room = "/root/users/" + player.opponent; 

                $('.monitor-text').text('> ' + room).css('width', (room.length + 3) + 'ch');
                $('#player-input-txt').css('width', '50%');

                gamestate = "running"; 

            } else {
                writeCommandFromServer(["INCORRECT PASSWORD", "DO YOU WANT TO CREATE A NEW USERNAME? [Y]/[N]"]);
                gamestate = "userexists"; 
            }
        }
    })

    // start game 
    socket.on('starting game', function(serverInfo) {
        if(game_ID == serverInfo[0]) {
            writeInitTextFromServer(serverInfo);
            $('.monitor-text').text('> /root ').css('width', '12%');
            $('#player-input-txt').css('width', '78%');  

            gamestate = "running";  
        }
    }); 

    // info from server based on player command
    // [0] = command response
    // [1] = gameID
    // [2] = playerID
    // [3] = current player room  
    socket.on('player command', function(serverInfo) {
        
        if(game_ID == serverInfo[1] && ID == serverInfo[2]) {
            console.log("serverinfo[0]: " + serverInfo[0]);
            if(serverInfo[0]) {
                // if the player inserted a valid command, write it above
                writeCommandFromServer(serverInfo[0]);

                // check if current room is "personal" - then change to username
                if(serverInfo[3] == "/root/users/personal") serverInfo[3] = "/root/users/" + opponent; 

                // set size of text showing the current path (room)
                $('.monitor-text').text('> ' + serverInfo[3]).css('width', (serverInfo[3].length + 3) + 'ch');
                $('#player-input-txt').css('width', '50%'); 

                let command = serverInfo[0][0].split(" ")[0];
                let param = serverInfo[0][0].split(" ")[1];
                
                switch(command) {

                    // if player requested to open a file
                    case "OPENING": 
                        if(param.toLowerCase() == "musicplayer.exe") {
                            musicplayer(); 
                        } else if(param.toLowerCase() == "chat.exe") {
                            chatroom(); 
                        } else {
                            // wait 2 seconds before opening the file
                            setTimeout(function() {
                                openFile(param); 
                            }, 2000); 
                        }
                        break;

                    // if player tries to enter admin folder
                    case "ENTER":
                        console.log("Enter admin password");
                        $('.monitor-text').text('>').css('width', '3ch');
                        $('#player-input-txt').css('width', '50%'); 
                        gamestate = "authorizing";  
                        break; 

                    // if player request system shutdown
                    case "SYSTEM":
                        console.log("system shutdown initiated");
                        gamestate = "killsystem";
                        writeKillSystem(phase);  

                        playKillMusic();

                        break; 
                } 
            } else {
                // if the player enteret an invalid command, write the error text above
                writeErrorMessage(); 
            }
        } 
    });

    // if the player wishes to enter admin folder, check if password is correct 
    socket.on('authorized', function(serverInfo) {
        if(game_ID == serverInfo[1] && ID == serverInfo[2]) {
            if(serverInfo[0]) {
                gamestate = "running";  
                socket.emit('player command', ["GOTO AUTH", game_ID, ID]);
            } else {
                writeCommandFromServer(["WRONG PASSWORD"]);
                gamestate = "running"; 
                socket.emit('player command', ["GOTO ..", game_ID, ID]);
            }
        }
    });

    // if a player has sent a message in the chatroom 
    socket.on('receivemessage', function(serverInfo) {        

        // for every player in the current game 
        if(game_ID == serverInfo[1]) {
            let input = serverInfo[0];

            // if the player who sent the message types EXIT - close chat 
            if(input == "EXIT" && ID == serverInfo[2]) {
                
                writeCommandFromServer(["CLOSING CHAT.EXE"]);
                gamestate = "running"; 
            
            // if the client is not the player that sent the message, output the message with a small encryption
            } else if(input != "EXIT" && ID != serverInfo[2]) {
            
                input = input.replace("A", "@");
                input = input.replace("E", "3");
                input = input.replace("I", "1");
                input = input.replace("O", "0");
                input = input.replace("S", "5");

                let msg = [
                    "INCOMING MESSAGE FROM: " + serverInfo[3],
                    input,
                ];

                if(gamestate != "chatroom") {
                    msg.push("TO RETURN A MESSAGE, OPEN CHAT.EXE");
                }

                writeCommandFromServer(msg);
            
            // if the player who sent the message didn't type EXIT
            } else if(input != "EXIT") {

                $('.monitor-text').text('>').css('width', '3ch');
                $('#player-input-txt').css('width', '50%');

                writeCommandFromServer(["MESSAGE SENT"]);
            }
        }
    });

    // if the player initiated the KILL SYSTEM procedure 
    socket.on('systemshutdown', function(serverInfo) {

        if(game_ID == serverInfo[1] && ID == serverInfo[2]) {

            // if not the final phase 
            if(phase < 4) {
                phase++; 
                console.log("phase: " + phase); 
                writeKillSystem(phase); 
            // after the final phase, check if the data entered is correct 
            } else {
                phase = 0; 
                console.log(serverInfo[0]); 
                writeEndText(serverInfo[0], serverInfo[4]); 
            }
        }        
    });

    // when the game is finished 
    socket.on('end game', function(serverInfo) {

        // if the client is the losing player 
        if(game_ID == serverInfo[1] && ID != serverInfo[2]) {

            // stop all music playing 
            $('#intro_track_suspense').animate({volume: 0}, 1000, function () {
                $('#intro_track_suspense')[0].pause();
                $('#intro_track_suspense')[0].currentTime = 0;
            });
    
            $('#track1').animate({volume: 0}, 1000, function () {
                $('#track1')[0].pause();
                $('#track1')[0].currentTime = 0;
            }); 
    
            $('#track2').animate({volume: 0}, 1000, function () {
                $('#track2')[0].pause();
                $('#track2')[0].currentTime = 0;
            }); 
    
            $('#track3').animate({volume: 0}, 1000, function () {
                $('#track3')[0].pause();
                $('#track3')[0].currentTime = 0;
            });

            $('#kill_sound').animate({volume: 0}, 1000, function () {
                $('#kill_sound')[0].pause();
                $('#kill_sound')[0].currentTime = 0;
            });

            $('#computer_glitch').prop("volume", 0.5);
            $('#computer_glitch')[0].play();

            // write message from the winning player 
            writeCommandFromServer([
                "...¤¤¤..@..?...*#..!.........", 
                "* YOU HAVE BEEN HACKED *", 
                "incoming message from your hacker, " + serverInfo[3],
                "" + serverInfo[0]
            ]); 

            // turn off the monitor 
            setTimeout(function() {

                $('#text-input-field').addClass('_off');
                $('#tv-off')[0].play();

                $('#computer_glitch')[0].pause();
                $('#computer_glitch')[0].currentTime = 0;

                $('#buzz').prop("volume", 0.02);
                $('#buzz')[0].play(); 
            
            }, 15000);

            // play awwww soung and turn off lights 
            setTimeout(function() {
                $('#aww')[0].play();
                
                setTimeout(function() {
                    $('#click2')[0].play();
                }, 3000);
    
                setTimeout(function() {
                    $('body').css('background-image',  'url("../images/background1.jpg")'); 
                    $('#postit').hide(); 
                    $('#startBtn').hide(); 
                }, 4000);
                
                setTimeout(function() {
                    $('#click1')[0].play(); 
                }, 6000);

                setTimeout(function() {
                    $('body').css('background-image',  'url("../images/background0.jpg")'); 
                }, 7000);

            }, 20000);

        // if the client is the winning player 
        } else if(game_ID == serverInfo[1] && ID == serverInfo[2]) {

            // turn off monitor 
            setTimeout(function() {  
                $('#text-input-field').addClass('_off');
                $('#tv-off')[0].play();

                $('#portal_radio')[0].pause();
                $('#portal_radio')[0].currentTime = 0;
    
                $('#player-interaction').css("visibility", "hidden"); 
            }, 1000);
    
            // play winning fanfare sound 
            setTimeout(function() {
                $('#fanfare')[0].play();  
            }, 6000);
        }
    });

    // if the player enters the musicplayer 
    function musicplayer() {

        gamestate = "musicplayer"; 
        $('.monitor-text').text('>').css('width', '3ch');
        $('#player-input-txt').css('width', '50%');

        // tracks to choose between 
        let tracks = [
            " ",
            "welcome to the musicplayer",
            "what would you like to listen to?",
            "[1] secret agent",
            "[2] computer hacks",
            "[3] groovy tunes",
        ]; 

        writeCommandFromServer(tracks);
    }

    // if the player enters the chatroom 
    function chatroom() {

        gamestate = "chatroom"; 
        $('.monitor-text').text('>').css('width', '3ch');
        $('#player-input-txt').css('width', '50%');

        let chatWelcome = [
            " ",
            "welcome to the chatroom",
            "write a message to all other players",
            "to exit the chatroom type [EXIT]"
        ];

        writeCommandFromServer(chatWelcome); 
    }

    // when a player enters the KILL SYSTEM procedure - stop all music and play suspenseful music 
    function playKillMusic() {

        $('#intro_track_suspense').animate({volume: 0}, 1000, function () {
            $('#intro_track_suspense')[0].pause();
            $('#intro_track_suspense')[0].currentTime = 0;
        });

        $('#track1').animate({volume: 0}, 1000, function () {
            $('#track1')[0].pause();
            $('#track1')[0].currentTime = 0;
        }); 

        $('#track2').animate({volume: 0}, 1000, function () {
            $('#track2')[0].pause();
            $('#track2')[0].currentTime = 0;
        }); 

        $('#track3').animate({volume: 0}, 1000, function () {
            $('#track3')[0].pause();
            $('#track3')[0].currentTime = 0;
        }); 

        $('#kill_sound').prop("volume", 0);
        $('#kill_sound')[0].play();
        $('#kill_sound').animate({volume: 1}, 1000, function () {});  
    }

    // opens a file in a new window tab 
    function openFile(file) {
        let tab = window.open("/files/" + file.toLowerCase(), '_blank');
        tab.focus();
    }

});