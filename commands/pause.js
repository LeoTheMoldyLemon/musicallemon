const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["pause"]},
	async execute(args, msg, client, player, config){
		try{
			if(player.pause()){
				await msg.reply("Paused the player")
			}else{
				await msg.reply("Failed to pause the player.")
			}
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong unpausing the queue.")
		}
	}
}