// this script handles when the player inputs something on the client side 
$(document).ready(function() { 
    
    //hide all text while typewriter animation plays
    $('#player-input-txt').css('visibility', 'hidden');
    $('label.monitor-text').css('visibility', 'hidden');
    
    var username = null; 
    var password = null;
    var playerInfo = {};  
    
    //when player hits 'enter'
    //get value from input field
    //append value above input field
    //assign new focus to input field
    $('#player-interaction').submit(function( event ) {
        event.preventDefault();
        
        if(gamestate != "finished") {
            
            var input = $('#player-input-txt').val().toUpperCase(); 
            writeTextFromClient(input); 
        }
        
        //client has just recieved welcome message
        switch(gamestate) {
            case "init": 
                if(!username) {
                    
                    // check the username entered
                    username = input;  
                    playerInfo.username = username;
                    socket.emit('check username', [ID, input]);

                } else {
                    if(!password) {

                        password = input; 
                        playerInfo.password = password; 

                        // if player already exists, check password, else create new 
                        if(!newuser) {
                            socket.emit('check password', [ID, username, input]); 
                        } else {   
                            writeTextFromScript(4, 1); 
                        }

                    } else {
                        if(!host) {
                            // if player chooses to host 
                            if(input == "HOST") {

                                host = true;
                                gamestate = "waiting";  
                                socket.emit('host game', [ID, playerInfo]);

                            // if player chooses to join 
                            } else if(input == "JOIN") {

                                host = false; 
                                writeTextFromScript(9, 1);   
                                gamestate = "joining"; 

                            // if player enters incorrect input
                            } else { 
                                writeTextFromScript(3, 2); 
                            }
                        }
                    }
                }
                break; 

            case "waiting": 
                writeTextFromScript(8, 1); 
                break; 

            case "joining":
                socket.emit('join game', [input, playerInfo, ID]);
                break; 

            case "ready":
                // when players are ready and the host enters START
                if(input == "START" && host) {
                    gamestate = "starting"; 
                    socket.emit('start game', [game_ID, ID]);

                } else if(host) {
                    writeTextFromScript(13, 2);
                } else {
                    writeTextFromScript(15, 1);
                }
                break;

            case "userexists":
                // if an existing user wishes to create a new user
                if(input == "Y") {

                    username = null;  
                    playerInfo.username = username;
                    password = null; 
                    playerInfo.password = password;
                    gamestate = 'init'; 
                    writeTextFromScript(1, 1);

                // if an existing user wishes to try to enter the password again 
                } else if(input == "N") {

                    password = null; 
                    playerInfo.password = password;
                    gamestate = 'init';
                    writeTextFromScript(2, 1);

                } else {
                    writeCommandFromServer(["SORRY, I DIDN'T GET THAT", "DO YOU WANT TO CREATE A NEW USERNAME? [Y]/[N]"]);
                }
                break;

            case "running":  
                socket.emit('player command', [input, game_ID, ID]); 
                break; 

            case "authorizing":
                socket.emit('authorizing', [input, game_ID, ID]);
                break;

            case "killsystem": 
                socket.emit('killsystem', [input, game_ID, ID, phase]);
                break;

            case "musicplayer":
                playmusic(input);
                break;

            case "chatroom":
                socket.emit('sendmessage', [input, game_ID, ID]);  
                break;

            case "finished":
                socket.emit('finished', [input, game_ID, ID]);
                break;
            default: 
                return; 
        }
    });

    // if the player enters the musicplayer, the can choose 1 out of 3 songs to play 
    function playmusic(tracknumber) {

        if(tracknumber == "1" || tracknumber == "2" || tracknumber == "3") {

            $('#intro_track_suspense')[0].pause();
            $('#intro_track_suspense')[0].currentTime = 0;

            $('#track1')[0].pause();
            $('#track1')[0].currentTime = 0;

            $('#track2')[0].pause();
            $('#track2')[0].currentTime = 0;

            $('#track3')[0].pause();
            $('#track3')[0].currentTime = 0;

            $('#track' + tracknumber)[0].play(); 

        } else {
            writeCommandFromServer(["UNABLE TO PLAY THAT TRACK"]); 
        }

        gamestate = "running"; 
        $('#text-input-field').scrollTop($('#text-input-field')[0].scrollHeight);
        socket.emit('player command', ["GOTO ..", game_ID, ID]);
    }
});