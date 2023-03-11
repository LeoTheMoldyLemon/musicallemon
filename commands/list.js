const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["list"]},
	async execute(args, msg, client, player, config){
		try{
			
			let playlists=require("../playlists.json")[msg.guildId]
			let content="Playlists currently saved in this server: \n"
			Object.keys(playlists).forEach((name)=>content+=name+"\n")
			await msg.reply(content)
			
			
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong with listing the playlists.")
		}
	}
}