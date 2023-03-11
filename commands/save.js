const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["save", "overwrite"]},
	async execute(args, msg, client, player, config){
		try{
			if(args==""){
				await msg.reply("You have to specify the name.")
				return;
			}
			let saved=require("../playlists.json")
			if(!saved[msg.guildId]){
				saved[msg.guildId]={}
			}
			if(saved[msg.guildId].hasOwnProperty(args) && msg.content.replace(config.symbol, "").split(" ")[0]!="overwrite"){
				await msg.reply("A playlist with that name has already been saved. Use `"+config.symbol+"overwrite` to overwrite the playlist.")
				return;
			}
			saved[msg.guildId][args]=player.queue
			await fs.writeFile("playlists.json", JSON.stringify(saved), async (e)=>{
				if(e){
					console.error(new Date().toUTCString()+"> ", e)
					await msg.reply("Something went wrong saving the queue.")
				}else{
					await msg.reply("Saved current queue as "+args)
				}
			})
			
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong saving the queue.")
		}
	}
}