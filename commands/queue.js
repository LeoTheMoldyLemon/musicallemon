const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["queue", "q"]},
	async execute(args, msg, client, player, config){
		try{
			if(player.queue.length==0){
				await msg.reply("Queue is empty, add some songs with `"+config.symbol+"play`.")
				return;
			}
			let page=parseInt(args)
			if(!page){
				page=1
			}
			if(page<1){
				page=1
			}
			page=Math.min(page, Math.floor(player.queue.length/15)+1)
			let embed={"title":"songqueue", "color":16774662,"description":"Page: "+page+" \n"}
			for(let i=15*(page-1); i<Math.min(15*page, player.queue.length); i++){
				if(i==player.current){
					embed.description+="**"
				}
				embed.description+=(i+1)+". "+player.queue[i].title+" [link]("+player.queue[i].url+")"
				if(i==player.current){
					embed.description+="**"
				}
				embed.description+="\n"
			}
			await msg.reply({embeds:[embed]})
		}catch(e){
			console.error(new Date().toUTCString()+"> ", e)
			await msg.reply("Something went wrong with displaying the queue.")
		}
	}
}