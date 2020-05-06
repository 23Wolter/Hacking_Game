// this script initializes the game 
// open a socket on client side
var socket = io();

// initiate global client-side variables 
var gamestate = "";
var ID;  
var game_ID; 
var host = null; 
var phase = 0; 
var newuser; 

$(document).ready(function() { 

    let start = false; 
    let interval; 

    // when the user clicks the center of the screen - start the game  
    $(document.body).click(function() {

        if(!start) {
            start = true; 
            console.log("click"); 

            setTimeout(function() {
                $('#click1')[0].play();
            }, 1000);

            setTimeout(function() {
                $('body').css('background-image',  'url("../images/background1.jpg")'); 
            }, 1500);
            
            setTimeout(function() {
                $('#click2')[0].play(); 
            }, 2500);
            
            setTimeout(function() {
                $('body').css('background-image',  'url("../images/background.jpg")');
                $('#startBtn').show();
                $('#postit').show();
            }, 3000);
            
            setTimeout(function() {
                $('#buzz').prop("volume", 0.02);
                $('#buzz')[0].play(); 

            }, 3500);

            let toggle = true; 
            
            interval = setInterval(function() {
                if(toggle) {
                    $('#startBtn div').css("background-color", "lawngreen");
                } else {
                    $('#startBtn div').css("background-color", "#3d3c37");
                }
                toggle = !toggle;
            }, 1000);
        }
    });
    
    // when client connects - overwrite/update socket ID
    socket.on('welcome', function(socketID) {
        if(!ID) { ID = socketID; }
    });
    
    // when player clicks start button, begin game 
    $('#startBtn').click(function() {

        $(document.body).unbind();
        $('#startBtn').unbind(); 

        clearInterval(interval); 
        $('#startBtn div').css("background-color", "lawngreen");
        
        $('#intro_start')[0].play(); 

        setTimeout(function() {
            setTimeout(function() {
                $('#intro_start2').prop("volume", 0);
                $('#intro_start2')[0].play();
                $('#intro_start2').animate({volume: 0.2}, 1000, function () {});
            }, 12000);

            startGame(); 
        }, 15000);
    });
}); 

// initiate game
function startGame() {
    gamestate = 'init'; 
    writeTextFromScript(0, 2);
}