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
            // $input = $('<p>').text(input); 
            // $('#player-input-print').append($input); 
            //        $('#player-input-txt').val('').focus();
            writeTextFromClient(input); 
        }
        
        //client has just recieved welcome message
        switch(gamestate) {
            case "init": 
                if(!username) {
                    
                    let userFromStorage = JSON.parse(localStorage.getItem("user"));
                    if(userFromStorage && userFromStorage == input) {
                        userExists(userFromStorage); 
                    } else {   
                        username = input;  
                        playerInfo.username = username;
                        localStorage.setItem("user", JSON.stringify(username));  
                        writeTextFromScript(2, 1); 
                    }
                } else {
                    if(!password) {
                        password = input; 
                        playerInfo.password = password; 
                        console.log("password" + password);
                        writeTextFromScript(4, 1); 
                    } else {
                        if(!host) {
                            if(input == "HOST") {
                                host = true;
                                gamestate = "waiting";  
                                socket.emit('host game', [ID, playerInfo]);
                            } else if(input == "JOIN") {
                                host = false; 
                                writeTextFromScript(9, 1);   
                                gamestate = "joining"; 
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
                if(input == "Y") {
                    let userFromStorage = JSON.parse(localStorage.getItem("user"));
                    socket.emit('find player', userFromStorage); 
                } else if(input == "N") {
                    writeCommandFromServer(["CHOOSE A DIFFERENT USERNAME"]); 
                    startGame(); 
                }  else {
                    writeCommandFromServer(["SORRY I DIDN'T GET THAT", "CONTINUE GAME? [Y]/[N]"]); 
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


    function userExists(user) {
        writeCommandFromServer(["USER EXISTS", "CONTINUE GAME? [Y]/[N]"]); 
        gamestate = "userexists"; 
    }


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
            writeCommandFromServer(["UNABLE TO PLAY TRACK"]); 
        }

        gamestate = "running"; 
        
        $('#text-input-field').scrollTop($('#text-input-field')[0].scrollHeight);

        socket.emit('player command', ["GOTO ..", game_ID, ID]);
    }
});