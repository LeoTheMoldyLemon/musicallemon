const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["halp", "h"]},
	async execute(args, msg, client, player, config){
		try{
			let colors={"$":16774662 ,"&":13656088 ,"%":8166696}
			let embed={"title":"Command list","description":"This bot belongs to <@821854204904603658>, feel free to yell at me if stuff bugs out, crashes, or if you have feature ideas or for any other reason really.\n\n`"+config.symbol+"p`, `"+config.symbol+"play` - Joins your voice channel and plays the song you specified as the argument. The command accepts search terms, playlists, and video links.\n`"+config.symbol+"clear`, `"+config.symbol+"c` - Stops playing, clears the queue.\n`"+config.symbol+"cp` - Same as `clear` followed by `play`.\n`"+config.symbol+"loop`, `"+config.symbol+"l` - Toggle looping the queue.\n`"+config.symbol+"pause` - Pauses the current song.\n`"+config.symbol+"unpause`, `continue` - Unpauses if paused.\n`"+config.symbol+"skip`, `s` - Skips the current song and plays the next song in queue.\n`"+config.symbol+"halp`, `h` - Displays this message.\n`"+config.symbol+"queue` or `q` - Displays the queue. You can select the page by including it as an argument. (eg. `"+config.symbol+"q 3`)\n`"+config.symbol+"fuckoff` - Fucks off.\n `"+config.symbol+"save` - saves the current playlist. Playlists saved on one bot can be loaded on another. \n `"+config.symbol+"load` - replaces the current queue with a saved playlist. \n`"+config.symbol+"list` - lists all playlists saved ion the server by name.\n`"+config.symbol+"seek` - go to a timestamp in the song that is currently playing. The argument is either the timestamp in seconds or in the `hours:minutes:seconds` format. \n`"+config.symbol+"goto` - skip all the way to a specific song in the current queue. Accepts only ordinal number of the song.","color":colors[config.symbol]}
			await msg.reply({embeds:[embed]})
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong displaying the message.")
		}
	}
}