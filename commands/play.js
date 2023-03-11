const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");

module.exports = {
	data: {names:["play", "p", "cp"]},
	async execute(args, msg, client, player, config){
		try{
			if (!msg.member.voice?.channel) return msg.reply('You have to be connected to a voice channel in order to play a song.')
			
			player.connection = joinVoiceChannel({
				channelId: msg.member.voice.channel.id,
				guildId: msg.guild.id,
				adapterCreator: msg.guild.voiceAdapterCreator
			})
			
			player.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
				try {
					await Promise.race([
						entersState(player.connection, VoiceConnectionStatus.Signalling, 5_000),
						entersState(player.connection, VoiceConnectionStatus.Connecting, 5_000),
					]);
					// Seems to be reconnecting to a new channel - ignore disconnect
				} catch (error) {
					// Seems to be a real disconnect which SHOULDN'T be recovered from
					player.playing=false
					player.queue=[]
					player.current=0
					player.loop=false
					player.connection.destroy();
				}
			});
			
			if(player.connection.listenerCount("stateChange")==0){
				player.connection.on('stateChange', (oldState, newState) => {
					const oldNetworking = Reflect.get(oldState, 'networking');
					const newNetworking = Reflect.get(newState, 'networking');
					const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
						const newUdp = Reflect.get(newNetworkState, 'udp');
						clearInterval(newUdp?.keepAliveInterval);
					}
					oldNetworking?.off('stateChange', networkStateChangeHandler);
					newNetworking?.on('stateChange', networkStateChangeHandler);
				});
				
				player.connection.on("error", (e) => {
					console.error(new Date().toUTCString()+"> [CONNECTION ERROR] ",e);
				})
			}
			/*player.connection.on("stateChange", (oldState, newState) => {
				console.log(new Date().toUTCString()+"> [CONNECTION CHANGE] ",oldState, " --> ", newState);
			})*/
			
			
			if(msg.content.replace(config.symbol, "").split(" ")[0]=="cp"){
				player.queue=[]
				player.playing=false
				player.current=0
				player.stop()
			}
			if(args.startsWith('https') && play.yt_validate(args) === 'video') {
				console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: Recognized as video link.`)
				try{
					let video = await play.video_info(args)
					player.queue.push({url:args, title:video.video_details.title})
					if(player.playing){
						await msg.reply("Added "+video.video_details.title+" to queue.")
					}
				}catch(e){
					console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: Video could not be fetched.`)
					console.error(new Date().toUTCString()+"> ", e)
					await msg.reply("Video could not be fetched, check if the link is correct or if the video is private/age restricted.")
					return;
				}
				
			}else if(args.startsWith('https') && play.yt_validate(args) === 'playlist'){
				console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: Recognized as playlist link.`)
				try{
					let playlist = await play.playlist_info(args, { incomplete : true })
					let rep = await msg.reply("Fetching "+playlist.videoCount+" songs from the playlist...")
					let videos = await playlist.all_videos()
					videos.forEach(async(video)=>{
						player.queue.push({url:video.url, title:video.title})
					})
					await rep.edit("Fetched "+videos.length+" songs from the playlist.")
				}catch(e){
					console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: Video could not be fetched.`)
					console.error(new Date().toUTCString()+"> ", e)
					await msg.reply("Videos could not be fetched, check if the link is correct or if the playlist is private.")
					return;
				}
			}else if(play.yt_validate(args) === 'search'){
				console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: Recognized as search.`)
				const videos = await play.search(args, { limit : 1 })
				player.queue.push({url:videos[0].url, title:videos[0].title})
				if(player.playing){
					await msg.reply("Added "+videos[0].title+" to queue.")
				}
			}else{
				await msg.reply("Something is wrong with that argument.")
			}
			try{
				if(!player.playing){
					let stream=await play.stream(player.queue[player.current].url)
					let resource = createAudioResource(stream.stream, {inputType: stream.type})
					await player.play(resource)
					await player.connection.subscribe(player)
					await msg.reply("Playing: "+player.queue[player.current].title)
					player.playing=true
				}
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