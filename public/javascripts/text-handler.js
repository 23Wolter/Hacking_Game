var txts = [
    "BOOTING...",
    "INPUT USERNAME:",
    "INPUT PASSWORD:",
    "NOT A VALID INPUT",
    "WOULD YOU LIKE TO [HOST] OR [JOIN] A GAME:",
    "HOSTING NEW GAME",
    "USE THIS ID TO JOIN THE GAME: ",
    "CURRENT NUMBER OF PLAYERS: ",
    "WAITING FOR OTHER PLAYERS TO JOIN...",
    "INPUT GAME ID:",
    "JOINED GAME!",
    "PLAYER JOINED",
    "CURRENT NUMBER OF PLAYERS: ",
    "TO START GAME ENTER [START]",
    "WAITING FOR OTHER PLAYERS TO JOIN...",
    "WAITING FOR HOST TO START GAME",
    "NO GAME FOUND WITH THAT ID",
    "INPUT GAME ID:",
    "GAME RESUMED..."
]; 


function writeTextFromScript(index, pieces) {

    $('#typing_sound')[0].play();

    for(var i=0; i<pieces; i++) {

        if($('#text_' + (index + i))) {
            $('#text_' + (index + i)).remove();     
        } 

        $txt = $('<div>').attr({
            id: 'text_' + (index + i),
            class: 'text-output'
        }).text(txts[(index + i)]); 
        
        $('#write-text').append($txt); 
    }

    printMessage(index, pieces, 0, 60); 
}


function writeTextFromClient(userTxt) {

    $('#typing_sound')[0].play();

    $txt = $('<div>').attr({
        class: 'player-input-print'
    }).text(userTxt); 
    
    $('#write-text').append($txt); 


    // printMessage(index, 1, 0, 60); 
}

var opponent; 

function writeInitTextFromServer(textArrays) {
    
    $('#typing_sound')[0].play();

    setTimeout(function() {
        $('#computer_glitch').prop("volume", 0.5);
        $('#computer_glitch')[0].play();
    }, 11000); 

    setTimeout(function() {
        $('#typing_sound')[0].pause();
        $('#typing_sound')[0].currentTime = 0;
    }, 19000);

    setTimeout(function() {
        $('#computer_glitch').animate({volume: 0}, 1000, function () {
            $('#computer_glitch')[0].pause();
            $('#computer_glitch')[0].currentTime = 0;
        });

        $('#computer_warning')[0].play();
    }, 24000);

    setTimeout(function() {
        $('#computer_warning')[0].play();
    }, 28000);

    setTimeout(function() {
        $('#computer_warning')[0].play();
    }, 32000);

    setTimeout(function() {
        $('#computer_warning')[0].pause();
        $('#computer_warning')[0].currentTime = 0;

        $('#suspense_loop').prop("volume", 0);
        $('#suspense_loop')[0].play();
        $('#suspense_loop').animate({volume: 1}, 1000, function () {}); 

        $('#buzz')[0].pause();

        setTimeout(function() {
            $('#suspense_loop').animate({volume: 0}, 1000, function () {
                $('#suspense_loop')[0].pause();
                $('#suspense_loop')[0].currentTime = 0;
            });

            $('#intro_track_suspense').prop("volume", 0);
            $('#intro_track_suspense')[0].play();
            $('#intro_track_suspense').animate({volume: 1}, 1000, function () {});
        }, 35000);

    }, 36000);

    let starting_index = $('#write-text div').length + 1;
    let count = 0; 
    console.log("TEXT ARRAYS: ", textArrays); 

    let username; 
    for(let n=0; n<textArrays[4].length; n++) {
        let p = textArrays[4][n]; 
        if(p.playerID == ID) {
            username = p.username; 
            opponent = p.opponent; 
            break; 
        }
    }

    textArrays[1][1] = textArrays[1][1].replace("[NAME]", username);
    textArrays[3][1] = textArrays[3][1].replace("[OPPONENT]", opponent);  

    for(let i=1; i<textArrays.length-1; i++) {
        for(let j=0; j<textArrays[i].length; j++) {

            $txt = $('<div>').attr({
                id: 'text_' + (starting_index + count),
                class: 'text-output'
            }).text(textArrays[i][j]).css('color', 'lawngreen'); 
            
            if(i == 2) {
                $txt.css('color', 'red'); 
            }

            $('#write-text').append($txt); 

            count++; 
        }
    }

    let txtArr = textArrays[1].concat(textArrays[2]);
    txtArr = txtArr.concat(textArrays[3]);  

    printMessage(starting_index, txtArr.length, 0, 60);  
}


function writeCommandFromServer(command) {

    $('#typing_sound')[0].play(); 
    console.log(command[0]); 

    let starting_index = $('#write-text div').length + 1; 

    for(var i=0; i<command.length; i++) {

        $txt = $('<div>').attr({
            id: 'text_' + (starting_index + i),
            class: 'text-output'
        }).text(command[i]).css('color', 'lawngreen');

        $('#write-text').append($txt); 
    }

    printMessage(starting_index, command.length, 0, 60); 
    
    // //scroll input window to bottom to reveal input field
    // $('#text-input-field').scrollTop($('#text-input-field')[0].scrollHeight);
}


function writeErrorMessage() {

    let starting_index = $('#write-text div').length; 

    $txt = $('<div>').attr({
        id: 'text_' + starting_index,
        class: 'text-output'
    }).text("InputError: command not found!"); 

    $txt2 = $('<div>').attr({
        id: 'text_' + (starting_index + 1),
        class: 'text-output'
    }).text("type 'HELP' for list of commands");

    $('#write-text').append($txt, $txt2);
    
    printMessage(starting_index, 2, 0, 60); 
}


function writeKillSystem(phase) {

    
    if(phase == 0) {
        let starting_index = $('#write-text div').length; 

        $txt = $('<div>').attr({
            id: 'text_' + starting_index,
            class: 'text-output'
        }).text(" "); 

        $txt2 = $('<div>').attr({
            id: 'text_' + (starting_index + 1),
            class: 'text-output'
        }).text("*** INITIATING SYSTEM SHUTDOWN PROTOCOL ***").css('color', 'red');

        $txt3 = $('<div>').attr({
            id: 'text_' + (starting_index + 2),
            class: 'text-output'
        }).text("* AUTHORIZATION REQUIRED").css('color', 'red');

        $txt4 = $('<div>').attr({
            id: 'text_' + (starting_index + 3),
            class: 'text-output'
        }).text("1/5 VERIFY USERNAME:").css('color', 'red');
        
        $('#write-text').append($txt, $txt2, $txt3, $txt4);
        
        printMessage(starting_index, 4, 0, 60);

    } else if(phase == 1) {

        let starting_index = $('#write-text div').length; 
        
        $txt = $('<div>').attr({
            id: 'text_' + starting_index,
            class: 'text-output'
        }).text("2/5 CONFIRM PASSWORD:").css('color', 'red');

        $('#write-text').append($txt);
        
        printMessage(starting_index, 1, 0, 60);
    
    } else if(phase == 2) {

        let starting_index = $('#write-text div').length; 

        $txt = $('<div>').attr({
            id: 'text_' + starting_index,
            class: 'text-output'
        }).text("* ANSWER THE SECURITY QUESTIONS").css('color', 'red');

        $txt2 = $('<div>').attr({
            id: 'text_' + (starting_index + 1),
            class: 'text-output'
        }).text("3/5 WHAT IS THE NAME OF YOUR PET?").css('color', 'red');

        $('#write-text').append($txt, $txt2);
        
        printMessage(starting_index, 2, 0, 60);

    } else if(phase == 3) {

        let starting_index = $('#write-text div').length; 

        $txt = $('<div>').attr({
            id: 'text_' + starting_index,
            class: 'text-output'
        }).text("4/5 WHAT IS THE BEST CD ALBUM?").css('color', 'red');

        $('#write-text').append($txt);
        
        printMessage(starting_index, 1, 0, 60);

    } else if(phase == 4) {

        let starting_index = $('#write-text div').length; 

        $txt = $('<div>').attr({
            id: 'text_' + starting_index,
            class: 'text-output'
        }).text("5/5 ENTER THE KILLCODE:").css('color', 'red');

        $('#write-text').append($txt);
        
        printMessage(starting_index, 1, 0, 60);

    } else {

        $txt = $('<div>').attr({
            id: 'text_' + (starting_index + 1),
            class: 'text-output'
        }).text("*** WRONG INPUT ***").css('color', 'red');

        $txt2 = $('<div>').attr({
            id: 'text_' + (starting_index + 1),
            class: 'text-output'
        }).text("*** TERMINATING SYSTEM SHUTDOWN PROTOCOL ***").css('color', 'red');

        $('#write-text').append($txt, $txt2);
        printMessage(starting_index, 2, 0, 60);


        // set size of text showing the current path (room)
        $('.monitor-text').text('> ' + phase).css('width', (phase.length + 3) + 'ch');
        $('#player-input-txt').css('width', '50%');


        gamestate = "running"; 
        
    }

}


function writeEndText(playerAnswers, playerUsername) {
    
    let starting_index = $('#write-text div').length; 
    
    $txt = $('<div>').attr({
        id: 'text_' + starting_index,
        class: 'text-output'
    }).text("*** PROCESSING USER INPUT ***").css('color', 'red'); 
    
    $txt2 = $('<div>').attr({
        id: 'text_' + (starting_index + 1),
        class: 'text-output'
    }).text("|.../...-...\\...|.../...-...\\...|.../...-...\\...|.../...-...\\...|").css('color', 'red');
    
    if(playerAnswers[0]) {

        $txt3 = $('<div>').attr({
            id: 'text_' + (starting_index + 2),
            class: 'text-output'
        }).text("1/5 VERIFY USERNAME: OK").css('color', 'red');
    } else {
        $txt3 = $('<div>').attr({
            id: 'text_' + (starting_index + 2),
            class: 'text-output'
        }).text("1/5 VERIFY USERNAME: FAIL").css('color', 'red');
    }

    if(playerAnswers[1]) {

        $txt4 = $('<div>').attr({
            id: 'text_' + (starting_index + 3),
            class: 'text-output'
        }).text("2/5 CONFIRM PASSWORD: OK").css('color', 'red');
    } else {
        $txt4 = $('<div>').attr({
            id: 'text_' + (starting_index + 3),
            class: 'text-output'
        }).text("2/5 CONFIRM PASSWORD: FAIL").css('color', 'red');
    }

    if(playerAnswers[2]) {
        $txt5 = $('<div>').attr({
            id: 'text_' + (starting_index + 4),
            class: 'text-output'
        }).text("3/5 WHAT IS THE NAME OF YOUR PET: OK").css('color', 'red');
    } else {
        $txt5 = $('<div>').attr({
            id: 'text_' + (starting_index + 4),
            class: 'text-output'
        }).text("3/5 WHAT IS THE NAME OF YOUR PET: FAIL").css('color', 'red');
    }

    if(playerAnswers[3]) {
        $txt6 = $('<div>').attr({
            id: 'text_' + (starting_index + 5),
            class: 'text-output'
        }).text("4/5 WHAT IS THE BEST CD ALBUM: OK").css('color', 'red');
    } else {
        $txt6 = $('<div>').attr({
            id: 'text_' + (starting_index + 5),
            class: 'text-output'
        }).text("4/5 WHAT IS THE BEST CD ALBUM: FAIL").css('color', 'red');
    }

    if(playerAnswers[4]) {
        $txt7 = $('<div>').attr({
            id: 'text_' + (starting_index + 6),
            class: 'text-output'
        }).text("5/5 KILLCODE: OK").css('color', 'red');
    } else {
        $txt7 = $('<div>').attr({
            id: 'text_' + (starting_index + 6),
            class: 'text-output'
        }).text("5/5 KILLCODE: FAIL").css('color', 'red');
    }



    if(playerAnswers[0] && playerAnswers[1] && playerAnswers[2] && playerAnswers[3] && playerAnswers[4]) {

        $end = $('<div>').attr({
            id: 'text_' + (starting_index + 7),
            class: 'text-output'
        }).text("EXECUTING COMPLETE SYSTEM SHUTDOWN...").css('color', 'red');

        $end2 = $('<div>').attr({
            id: 'text_' + (starting_index + 8),
            class: 'text-output'
        }).text(" ").css('color', 'red');

        $end3 = $('<div>').attr({
            id: 'text_' + (starting_index + 9),
            class: 'text-output'
        }).text("CONGRATULATIONS " + playerUsername + "!").css('color', 'lawngreen');

        $end4 = $('<div>').attr({
            id: 'text_' + (starting_index + 10),
            class: 'text-output'
        }).text("YOU HAVE SUCCESSFULLY HACKED YOUR OPPONENT!").css('color', 'lawngreen');

        $end5 = $('<div>').attr({
            id: 'text_' + (starting_index + 11),
            class: 'text-output'
        }).text("NOW WRITE A MESSAGE TO YOUR OPPONENT").css('color', 'lawngreen');

        $('#write-text').append($txt, $txt2, $txt3, $txt4, $txt5, $txt6, $txt7, $end, $end2, $end3, $end4, $end5);
        printMessage(starting_index, 12, 0, 60);

        gamestate = 'finished'; 
        
        setTimeout(function() {
            $('#kill_sound').animate({volume: 0}, 1000, function () {
                $('#kill_sound')[0].pause();
                $('#kill_sound')[0].currentTime = 0;
            });

            $('#portal_radio').prop("volume", 0); 
            $('#portal_radio')[0].play(); 
            $('#portal_radio').animate({volume: 1}, 1000, function () {});

            $('#buzz').prop("volume", 0.02);
            $('#buzz')[0].play();
        }, 45000);

    } else {
        $end = $('<div>').attr({
            id: 'text_' + (starting_index + 7),
            class: 'text-output'
        }).text("*** SYSTEM SHUTDOWN FAILED ***").css('color', 'red');

        $end2 = $('<div>').attr({
            id: 'text_' + (starting_index + 8),
            class: 'text-output'
        }).text(" ").css('color', 'lawngreen');

        $end3 = $('<div>').attr({
            id: 'text_' + (starting_index + 9),
            class: 'text-output'
        }).text("FOR HELP NAVIGATING THE SYSTEM TYPE 'HELP'").css('color', 'lawngreen');
        
        gamestate = "running"; 
        
        setTimeout(function() {
            $('#kill_sound').animate({volume: 0}, 1000, function () {
                $('#kill_sound')[0].pause();
                $('#kill_sound')[0].currentTime = 0;
            });
            
            $('#intro_track_suspense').prop("volume", 0); 
            $('#intro_track_suspense')[0].play(); 
            $('#intro_track_suspense').animate({volume: 1}, 1000, function () {});
        }, 45000);

        $('#write-text').append($txt, $txt2, $txt3, $txt4, $txt5, $txt6, $txt7, $end, $end2, $end3);
        printMessage(starting_index, 10, 0, 60);
    }
        
}