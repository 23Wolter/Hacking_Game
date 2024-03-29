const mongoose = require('mongoose');

module.exports = {

    initGameSchema: function() {

        // schema for games
        var gameSchema = new mongoose.Schema({
            gameID: String, 
            playerNumber: Number,
            players: { type: Array, default: [] }
        },{usePushEach: true}); 
        
        Game = mongoose.model('Game', gameSchema);

        return Game; 

    },


    initPlayerchema: function() {

        // schema for players
        var playerSchema = new mongoose.Schema({
            username: String,
            password: String, 
            playerID: String,
            room: String,
            opponent: String,
            opponentPassword: String,
            hiddenFiles: Boolean,
            killcode: { type: Array, default: [
                false, false, false, false, false
            ]}
        },{usePushEach: true}); 

        Player = mongoose.model('Player', playerSchema); 

        return Player; 

    },


    initRoomSchema: function() {

        // schema for rooms in the game
        var roomSchema = new mongoose.Schema({
            name: String, 
            accessible: Boolean,
            nextRooms: { type: Array, default: []},
            prevRoom: String,
            items: { type: Array, default: []}
        },{usePushEach: true}); 
        
        Room = mongoose.model('Room', roomSchema);
        
        return Room; 
    },


    initCloudSchema: function() {

        // schema for rooms in the game
        var cloudSchema = new mongoose.Schema({
            name: String, 
            gameID: String, 
            accessible: Boolean,
            nextRooms: { type: Array, default: []},
            prevRoom: String,
            items: { type: Array, default: []}
        },{usePushEach: true}); 
        
        Cloud = mongoose.model('Cloud', cloudSchema);
        
        return Cloud; 
    },
    

    // initialize the rooms with specific values 
    initRooms: function() {

        var root = new Room({
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
        });
        
        root.save(function (err) { if (err) console.error(err); });


        var applications = new Room({
            name: "/root/applications",
            accessible: true,
            nextRooms: [],
            prevRoom: "/root",
            items: [
                "musicplayer.exe",
                "chat.exe"
            ]
        });
        
        applications.save(function (err) { if (err) console.error(err); });


        var users = new Room({
            name: "/root/users",
            accessible: true,
            nextRooms: [
                "/root/users/personal",
                "/root/users/admin"
            ],
            prevRoom: "/root",
            items: []
        });
        
        users.save(function (err) { if (err) console.error(err); });


        var personal = new Room({
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
        });
        
        personal.save(function (err) { if (err) console.error(err); });


        var admin = new Room({
            name: "/root/users/admin",
            accessible: false,
            nextRooms: [
                "/root/users/admin/cloud"
            ],
            prevRoom: "/root/users",
            items: [
                "system-settings.txt"
            ]
        });
        
        admin.save(function (err) { if (err) console.error(err); });


        console.log("all rooms are setup"); 
    },
    
    createCloud: function(gameID) {
        
        var cloud = new Cloud({
            name: "/root/users/admin/cloud",
            gameID: gameID,
            accessible: true,
            nextRooms: [],
            prevRoom: "/root/users/admin",
            items: [
                "clue-1.txt",
                "clue-2.txt",
                "clue-3.txt",
                "clue-4.txt",
                "clue-5.txt",
                "clue-6.txt",
                "hidden file"
            ]
        });
        
        cloud.save(function (err) { if (err) console.error(err); });
        

    }
}