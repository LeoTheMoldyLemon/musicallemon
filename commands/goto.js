const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["goto"]},
	async execute(args, msg, client, player, config){
		try{
			try{
				let num=parseInt(args)
				if(!num || isNaN(num) || num<1){
					await msg.reply(args+" isn't a valid number.")
				}
				player.current=Math.min(num, player.queue.length)-1
				let stream=await play.stream(player.queue[player.current].url)
				let resource = createAudioResource(stream.stream, {inputType: stream.type})
				await player.play(resource)
				await player.connection.subscribe(player)
				await msg.reply("Playing: "+player.queue[player.current].title)
				player.playing=true
			}catch(e){
				console.error(new Date().toUTCString()+"> ", e)
				await msg.reply("Found the song, but failed to play.")
			}
			
			
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong with playing the song.")
		}
	}
}