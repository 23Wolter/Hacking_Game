// this script is responsible for the actual typing effect of text on the monitor

// recursive function that prints out each text pieces defined in the parameter, in the time also defined in the parameter
function printMessage(textIndex, textPieces, loopCount, loopLimit) {
    $('#player-input-txt').css('visibility', 'hidden').val('');
    
    //scroll input window to bottom to reveal input field
    $('#text-input-field').scrollTop($('#text-input-field')[0].scrollHeight);

    // gradually expand the div field that holds the text that is to be written 
    $('#text_' + textIndex).delay(50).animate({
        width: '+=10px'
    }, 10, 'linear', function() {

        // blink the "cursor"
        blinkCursor(textIndex, loopCount); 

        loopCount++;

        // loop limit determines for how long the typing effect should run 
        if(loopCount >= loopLimit) { 
            textPieces--; 
            if(textPieces == 0) {
                readPlayerInput(); 
                return;    
            } else {
                loopCount = 0;
                textIndex++

                $('#typing_sound')[0].play();
                printMessage(textIndex, textPieces, loopCount, loopLimit); 
            }
        } else {
            printMessage(textIndex, textPieces, loopCount, loopLimit); 
        }
    }); 
}

// for each iteration in the printMessage function, the cursor alternates between hidden and visible 
function blinkCursor(i, n) { 
    if(n % 2 == 1) {
        $('#text_' + i).css('border-right', '0.15em solid black'); 
    } else {        
        $('#text_' + i).css('border-right', '0.15em solid lawngreen');
    }
}

// whenever the printMessage function is done, the program plays a "beep" sound to indicate that the player can now type
function readPlayerInput() {

    $('#computer_beep')[0].play();

    $('body').css('cursor', 'default'); 
    $('#player-input-txt').css('visibility', 'visible').focus();
    $('label.monitor-text').css('visibility', 'visible');
}

// *** NOT USED *** 
//this function moves the player output field
function movePlayerPrint(tagIndex) {
    $('#player-input-txt').append($('#text_'+tagIndex));
    $('#player-input-print').append($('#text_'+tagIndex)); 
}