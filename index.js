import { createRequire } from "module";
const require = createRequire(import.meta.url);

//const express = require('express');
//const app = express();
//const port = 3000;
//app.get('/', (req, res) => res.send('Hello World!'));

//app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));




const {Discord,Intents,Client, Activity} = require('discord.js');
const jsonfile = require('jsonfile');

const bot = new Client({
     intents: [
         Intents.FLAGS.GUILDS,
         Intents.FLAGS.GUILD_PRESENCES,
         Intents.FLAGS.GUILD_MESSAGES
        ]});

// The minimum allowable time between saves (milliseconds)
const minumumSaveInterval = 10000;
// Whether or not the whitelist is saved
var saved = true;

var tokenFile = require('./TokenFile.json');
const prefix = '<';

var whiteListedApps = require("./whitelist.json");

var express = require('express');
	var app = express();
	const PORT = process.env.PORT || 80;
	var server = app.listen(PORT, function() {
		var host = server.address().address;
		var port = server.address().port;
		console.log("server is listening at http://%s:%s", host, port);
		app.get('/', function (req, res) {
			res.send('Bot is live');
		  });
	});
/**
 * Limits how often saves can happen to avoid abuse
 */
function scheduleSave(){
    if(saved){
        setTimeout(save, minumumSaveInterval);
        saved = false;
    }
}
/**
 * Saves the whitelist
 */
function save(){
    jsonfile.writeFile("./whitelist.json", whiteListedApps, { spaces: 2, EOL: '\r\n' }, function(err){
        if (err) throw(err);
    })
    console.log("Whitelist file saved.")
    saved = true;
}
//valorant skin peek
import {startBot} from "./discord/bot.js";
import {loadUserData} from "./valorant/auth.js";
import {loadAlerts} from "./discord/alerts.js";
import {loadConfig} from "./misc/config.js";

/* TODO list:
 * (done) Balance
 * (done) Auto fetch skins on startup
 * (done) Skin notifier/reminder
 * (done) Auto check for new valorant version every 15 minutes
 * (done) See current bundles
 * Password encryptor
 * Inspect weapon skin (all 4 levels + videos + radianite upgrade price)
 * Option to send shop automatically every day
 * More options in config.json
 * Simple analytics to see how many servers the bot is in
 * Admin commands (delete user, see/edit everyone's alerts, etc.)
 */

const config = loadConfig();
if(config) {
    loadUserData();
    loadAlerts();
    startBot();
}


//Calls when the bot first comes online
bot.on('ready',function(){
    console.log('Bot is online.');
    
    // Variable setup.
    var previousAction = ''
    var objectAdded = {}
    
    bot.user.setActivity('with your server.', {type:'MESSING'})
})

bot.on('message', message=>{
    let args = message.content.slice(prefix.length).split(" ");
    let moveRole = message.guild.roles.cache.find(x => x.name == 'sugoi')
    if (!message.content.startsWith(prefix)) return;
    // 0 is base command -- !ping help -- (ping in this case)
    switch(args[0]){
        // --- DO COMMANDS ---
        case 'ping':
            message.channel.send(`🏓Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(bot.ws.ping)}ms`);
            break;

        case 'website':
            message.channel.send("https://github.com/JacobStenson1/GameRoles")
            break;

        case 'add':
            var hasPerms = message.member.roles.cache.has(moveRole.id)
            if (hasPerms){
                var roleToAdd = args.slice(1,args.length).join(" ")
                var gameNameAdd = args.slice(1,args.length).join(" ")
                if ((!gameNameAdd) && (!roleToAdd)){
                    message.reply("Please enter the correct command (/add [gameName] [role name]")
                }else{
                    // Apply changes
                    whiteListedApps[gameNameAdd] = roleToAdd;
                    //var gameJustAdded = gameName
                    console.log("Added game: "+gameNameAdd+" with role name: "+roleToAdd)
                    message.reply("Added game: `"+gameNameAdd+"` with role name: `"+roleToAdd + "`")
                    var objectAdded = {'Game' : gameNameAdd, 'Role' :roleToAdd}
                    var previousAction = 'add'
                    // Save
                    scheduleSave();
                }
            }else{
                message.reply("You do not have sufficient permissions to perform that command.")
            }
            break;

        case 'addmygame':
            var hasPerms = message.member.roles.cache.has(moveRole.id)
            if (!args[1]){
                message.reply("Please provide a role name after the command.")
                break;
            }
            if (hasPerms){
                var roleToAdd = args.pop()
                // Get the game the user is playing
                gameNameAdd = message.member.presence.game.toString();

                if ((!gameNameAdd) && (!roleToAdd)){
                    message.reply("Please enter the correct command (/add [gameName] [role name]")
                }else{
                    // Apply changes
                    whiteListedApps[gameNameAdd] = roleToAdd;
                    //var gameJustAdded = gameName
                    console.log("Added game: "+gameNameAdd+" with role name: "+roleToAdd)
                    message.reply("Added game: "+gameNameAdd+" with role name: "+roleToAdd)
                    objectAdded = {'Game' : gameNameAdd, 'Role' :roleToAdd}
                    previousAction = 'addmygame'
                    // Save
                    scheduleSave();
                }
            }else{
                message.reply("You do not have sufficient permissions to perform that command.")
            }
            break;

        case 'delete':
            var hasPerms = message.member.roles.cache.has(moveRole.id)
            if (hasPerms){
                var roleToDelete = args.pop()
                var gameNameDelete = args.slice(1,args.length).join(" ")
                delete whiteListedApps[gameNameDelete]
                console.log("The "+gameNameDelete+" game and "+roleToDelete+" role, has been deleted from the whitelist.")
                message.reply("The "+gameNameDelete+" game and "+roleToDelete+" role, has been deleted from the whitelist.")
                // Save
                scheduleSave();
                previousAction = 'delete'
            }else{
                message.reply("You do not have sufficient permissions to perform that command.")
            }
            break;

        case 'undo':
            var hasPerms = message.member.roles.cache.has(moveRole.id)
            if (hasPerms){
                // If the file is saved...
                if (saved){
                    if (previousAction == 'add'){
                        // Delete the game that has just been added.
                        delete whiteListedApps[objectAdded['Game']]
                        message.reply(objectAdded['Game'] +": "+objectAdded['Role']+" - has been deleted.")
                        scheduleSave()
        
                    }else if (previousAction == 'delete'){
                        console.log("placeholder, deleted...")
                        //roleToDelete
                        //gameNameDelete
                        message.reply("Sorry, undoing a delete is not implemented yet.")
                    }else{
                        console.log("Issue.")
                        message.reply("Undo is not implemented yet.")
                    }
                }else{
                    message.reply("Please wait for the whitelist file to be saved.")
                }
            }else{
                message.reply("You do not have sufficient permissions to perform that command.")
            }
            break;
            
        case 'games':
            var hasPerms = message.member.roles.cache.find(role => role.name === 'sugoi')
            if (hasPerms){
                var stringToSend = "-- Here is the whitelist of games (game : role) -- \n"
                var whiteListedAppsLength = Object.keys(whiteListedApps).length

                for (i = 0; i < whiteListedAppsLength; i++) {
                    var key = Object.keys(whiteListedApps)[i]
                    var value = whiteListedApps[key]
                    var keyValueGames = (key +" : "+value)
                    stringToSend += (keyValueGames + "\n")
                }
                message.channel.send(stringToSend)
            }else{
                message.reply("You do not have sufficient permissions to perform that command.")
            }
           break;

        case 'info':
            message.channel.send("The author of this bot is Salazhar. See the GitHub for this bot here: https://github.com/JacobStenson1/GameRoles")
            break;

        // --- DO COMMANDS ---
        case 'help':
            var helpWith = args.pop()
            var messageContent
            switch(helpWith){
                case 'website':
                    messageContent = '```\n/website \nDisplays a link to the GitHub repository for this bot.```'
                    break;
                case 'add':
                    messageContent = '```\n/add \nAdds a game to the bots whitelist.\nUse in the form /add [gamename] [role name].\nIf the bot cannot find the role in your server, it will add it automatically.```'
                    break;
                case 'addmygame':
                    messageContent = '```\n/addmygame \nPulls the game you are playing and add the game to the whitelist.\nUse in the form /addmygame [role name].\nIf the bot cannot find the role in your server, it will add it automatically.```'
                    break;
                case 'delete':
                    messageContent = '```\n/add \nRemoves a game to the bots whitelist.\nUse in the form /add [gamename] [role name].```'
                    break;
                case 'undo':
                    messageContent = '```\n/undo \nUndoes the previous command.```'
                    break;
                case 'games':
                    messageContent = '```\n/games \nDisplays a list of all the games in the whitelist.\nThis will be in the form: [game] [role].```'
                    break;
            }
            if (!messageContent){
                messageContent = '```\n/help \nThis command allows you to view a little help section for each command.\nUse this in the form /help [command].\nCommands available are: website, add, addmygame, delete, undo, games.```'
            }
            message.channel.send(messageContent)
            break;
    }
})

bot.on('presenceUpdate', async (oldMember,newMember) => {
    
    try{
      //  console.log(newMember.activities[0])
     var newActivity = newMember?.activities?.find(x=> x?.type === 'PLAYING')
     var oldActivity = oldMember?.activities?.find(x=> x?.type === 'PLAYING')
     //for(i=0;i < oldActivity.length || i < newActivity.length;i++){
        //console.log(newActivity)
        console.log(newActivity?.type + '-' + newActivity?.name+ '----' +oldActivity?.type + '-' + oldActivity?.name)

           // console.log(oldActivity?.type + " " + newActivity?.type)
        //if (newActivity[i]?.type == "PLAYING" || oldActivity[i]?.type == "PLAYING"){
       // console.log(oldActivity[i]?.name + " " + newActivity[i]?.name)
     // If the game has changed...
       // if(oldActivity.name !== newActivity.name){
        var botsRole = newMember.guild.roles.cache.find(x => x.name == 'bot')
        var hasBotsRole = false; 
         //If found the bot role on the member (indicating they are a bot)
         if (botsRole){
            hasBotsRole = newMember.roles?.cache.has(botsRole.id)
        }
        // If the presence is nothing, return. Or if the member has the bot role.
        //console.log(newActivity.type)
        if(oldActivity?.type == 'PLAYING'){
        if(newActivity?.type == null ){
            console.log('not playing')
            var roleName="PLAYING " + oldActivity?.name
            //console.log(roleName)
            var roleToDelete = newMember.guild.roles.cache.find(x => x.name == roleName);
            
            //console.log(roleToDelete) 
            //console.log(roleToDelete.id)
            newMember.member.roles?.remove(roleToDelete.id)
        }
        if(newActivity?.type == "PLAYING" && newActivity?.name !== oldActivity?.name){
            console.log('change game')
            var roleName="PLAYING " + oldActivity?.name
            //console.log(roleName)
            var roleToDelete = newMember.guild.roles.cache.find(x => x.name == roleName);
            
            //console.log(roleToDelete) 
            //console.log(roleToDelete.id)
            newMember.member.roles?.remove(roleToDelete.id)
        }
    }
        var memberGameString = newActivity?.name.toString();
        //console.log(newMember.displayName+" : "+ memberGameString)
       
          
        
        // See if the application the user is running is whitelisted.
        if(memberGameString in whiteListedApps){
            console.log("exist")
            // Set roleName equal to the abreviated game name.
            var roleName ="PLAYING " + whiteListedApps[memberGameString];
            var role = newMember.guild.roles.cache.find(x => x.name == roleName);
            // Search could not find the role by the specific game name (game name could be abreviated).
            if(!role) {
                console.log(roleName+" does not exist in "+newMember.guild.name+". creating it.")
                // Waits till the role is created, then carries on.
                var highpost = newMember.guild.roles.highest.rawPosition
                //console.log(highpost)
                await newMember.guild.roles.create({name:roleName, mentionable:true,position:highpost-2, hoist:true, color:"#ff0000"})
                console.log("added role: "+roleName)
            }
            var roleToAdd = newMember.guild.roles.cache.find(x => x.name == roleName);

            // Does the person have the role already?
            var hasRole = newMember.roles?.cache.has(roleToAdd.id)
            if(!hasRole){
                // If they dont have the role...
                //console.log(roleToAdd.id)
                newMember.member.roles?.add(roleToAdd.id);
                //console.log(newMember)
                console.log("Gave "+ bot.users.cache.find(x=> x.id == newMember.userId).username +" the "+roleToAdd.name+" role.")
            }
        }
    //}
//};


//;}
;
}catch(error){
        console.error(error);
    }
});
bot.login(tokenFile.token);