function printMessage(textIndex, textPieces, loopCount, loopLimit) {
    $('#player-input-txt').css('visibility', 'hidden').val('');
    
    //scroll input window to bottom to reveal input field
    $('#text-input-field').scrollTop($('#text-input-field')[0].scrollHeight);

    $('#text_' + textIndex).delay(50).animate({
        width: '+=10px'
    }, 10, 'linear', function() {

        blinkCursor(textIndex, loopCount); 

        loopCount++;

        if(loopCount >= loopLimit) { 
            textPieces--; 
            if(textPieces == 0) {
                readPlayerInput(); 
                return;    
            } else {
                loopCount = 0;
                textIndex++

                $('#typing_sound')[0].play();
                // $('#typing_sound')[0].pause();
                // $('#typing_sound')[0].currentTime = 0; 

                printMessage(textIndex, textPieces, loopCount, loopLimit); 
            }
        } else {
            printMessage(textIndex, textPieces, loopCount, loopLimit); 
        }
    }); 
}

function blinkCursor(i, n) { 
    if(n % 2 == 1) {
        $('#text_' + i).css('border-right', '0.15em solid black'); 
    } else {        
        $('#text_' + i).css('border-right', '0.15em solid lawngreen');
    }
}

function readPlayerInput() {

    $('#computer_beep')[0].play();

    $('body').css('cursor', 'default'); 
    $('#player-input-txt').css('visibility', 'visible').focus();
    $('label.monitor-text').css('visibility', 'visible');
}


//this function moves 
function movePlayerPrint(tagIndex) {
    $('#player-input-txt').append($('#text_'+tagIndex));
    $('#player-input-print').append($('#text_'+tagIndex)); 
}