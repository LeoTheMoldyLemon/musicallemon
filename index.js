const discord = require('discord.js');
const { Collection } = discord;
const { join } = require('path');
const { get } = require("https");
const client = new discord.Client({ intents: 130809 });
const fs = require("fs");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play=require("play-dl");
console.log("Starting with config: "+process.argv[2]);
const config=require("./"+process.argv[2]);

client.commands = new Collection();
for (let file of fs.readdirSync("./commands").filter(file => file.endsWith('.js'))) {
	let cmnd = require("./commands/"+file);
	if ('data' in cmnd && 'execute' in cmnd) {
		cmnd.data.names.forEach((name)=>{
			client.commands.set(name, cmnd);
		})
	} else {
		console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
	}
}

client.once("ready", () => {
	client.user.setActivity(config.symbol+"halp");
	console.log(new Date().toUTCString()+"> "+client.user.username+' is ready!');
	
});
/*
client.on("debug", (e) => {
	console.log(new Date().toUTCString()+"> [DEBUG] ",e);
});*/

client.on("warn", (e) => {
	console.log(new Date().toUTCString()+"> [WARN] ",e);
});

client.on("error", (e) => {
	console.error(new Date().toUTCString()+"> [ERROR] ",e);
});


var players={}


client.on("messageCreate", async (msg) => {
	if(msg.content[0]!=config.symbol)return;
	let commandname=msg.content.replace(config.symbol, "").split(" ")[0]
	let command=client.commands.get(commandname)
	let args=msg.content.replace(msg.content.split(" ")[0], "")
	if(!command){
		await msg.reply("Command not recognized, use `"+config.symbol+"halp` to see a list of commands.")
		return;
	}
	if(!players[msg.guildId]){
		
		let playerIdleHandler=async function(){
			if(this.playing){
				if ((this.current + 1) < this.queue.length) {
					this.current++
					let stream=await play.stream(this.queue[this.current].url, {discordPlayerCompatibility :true})
					let resource = createAudioResource(stream.stream, {inputType: stream.type})
					this.play(resource)
				}else if (this.loop) {
					this.current=0
					let stream=await play.stream(this.queue[this.current].url, {discordPlayerCompatibility :true})
					let resource = createAudioResource(stream.stream, {inputType: stream.type})
					this.play(resource)
				}else{
					this.current++
					this.playing=false
				}
			}
		}
		
		players[msg.guildId]=createAudioPlayer()
		
		players[msg.guildId].on('error', e => {
			console.error(new Date().toUTCString()+"> [PLAYER ERROR] ",e);
		});
		
		players[msg.guildId].on(AudioPlayerStatus.Idle, playerIdleHandler.bind(players[msg.guildId]))
		
		players[msg.guildId].queue=[]
		players[msg.guildId].connection=null
		players[msg.guildId].current=0
		players[msg.guildId].playing=false
		players[msg.guildId].loop=false
	}
	console.log(new Date().toUTCString()+"> "+`[${msg.guild.name}] ${msg.member.user.username}: ${commandname}`)
	await command.execute(args.trim(), msg, client, players[msg.guildId], config)
})

client.login(config.token).catch(console.error);
