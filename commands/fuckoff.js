const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["fuckoff"]},
	async execute(args, msg, client, player, config){
		try{
			player.queue=[]
			player.playing=false
			player.current=0
			player.stop()
			try{
				await player.connection.destroy()
				player.connection=null
				await msg.reply("Fine. geez.")
			}catch{
				await msg.reply("I am literally already out. chill.")
			}
			
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong with leaving.")
		}
	}
}