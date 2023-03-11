const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["skip", "s"]},
	async execute(args, msg, client, player, config){
		try{
			player.playing=false
			player.current++
			if(player.current>=player.queue.length){
				player.current=0
			}
			let stream=await play.stream(player.queue[player.current].url, {discordPlayerCompatibility :true})
			let resource = createAudioResource(stream.stream, {inputType: stream.type})
			player.play(resource)
			player.playing=true
			await msg.reply("Skipped, playing: "+player.queue[player.current].title)
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong skipping.")
		}
	}
}