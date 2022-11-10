const discord = require('discord.js');
const { join } = require('path');
const token=process.env.token;
const intents = new discord.Intents(4737);
const ytdl = require('ytdl-core');
const client = new discord.Client({ intents });
const fs = require("fs");
const {joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus} = require('@discordjs/voice')
const search = require('youtube-search-api');
client.on('ready', () => {
	console.log('Ready!');
});

client.on('error', error => {
    console.log('The WebSocket encountered an error:', error);
});



client.on("messageCreate", async (msg)=>{
    console.log("["+msg.guild.name+"] "+msg.author.username+": "+msg.content)

    if (msg.content[0]=="$"){
        if(msg.guild.player === undefined){
            msg.guild.player = createAudioPlayer()
            msg.guild.player.songqueue=[]
            msg.guild.player.songtitlequeue=[]
            msg.guild.player.currentsong=0
            msg.guild.player.playerstate=false
            msg.guild.player.loopq=false
            msg.guild.player.on('error', error => {
                console.log("["+msg.guild.name+"]"+"Error player:", error);
				msg.guild.player.currentsong--
            });
            let playerrr=msg.guild.player
            
            playerEventHandler=function(){
            
            
            
            
            
                console.log("["+msg.guild.name+"]"+"Player is idle.")
                
                if(this.playerstate){
                    if ((this.currentsong+1)<this.songqueue.length){
                        this.currentsong++
                        playAudio(this.songqueue[this.currentsong], this)
                    }else{
                        if(this.loopq){
                            this.currentsong=0
                            playAudio(this.songqueue[this.currentsong], this)
                        }else{
                            this.currentsong++
                            this.playerstate=false
                        }
                    }
                }
            };
            
            msg.guild.player.on(AudioPlayerStatus.Idle, playerEventHandler.bind(playerrr) )
            
            
            
            
            
            
        }
        command=msg.content.substring(1).split(/ +/);
        argument=""
        for(i=1; i<(command.length); i++){
            argument=argument+command[i]
            if(i!=(command.length-1)){
                argument=argument+" "
            }
        }
        switch(command[0]){
            case "say":
                msg.reply(argument)
            break;
			case "p":
            case "play":
                console.log("["+msg.guild.name+"]"+"Attempting to play a song.")
                if (!msg.member.voice.channel){
                    msg.reply("You must be in a voice channel.")
					console.log("["+msg.guild.name+"]"+"User wasn't in voice channel.")
                    break;
                }

                msg.guild.conn=joinVoiceChannel({
                    channelId: msg.member.voice.channel.id,
                    guildId: msg.guild.id,
                    adapterCreator: msg.guild.voiceAdapterCreator
                })
                msg.guild.conn.subscribe(msg.guild.player)
                try{
                    
                    
                    maybeplaylist=argument.replace(" ", "").replace("&", "=").replace("?", "=").split("=")
                    console.log("["+msg.guild.name+"]"+"Checkin if it's a playlist.")
                    checker=true
                    for(i=0; i<maybeplaylist.length; i++){
                        if(maybeplaylist[i]=="list"){
                            await parseplaylist(maybeplaylist[i+1], msg)
                            checker=false
                            break
                        }
                    }
                    if(checker){
                        a=asdfjo()
                    }
                    
                }catch (error){
                    console.log("["+msg.guild.name+"]"+"Checking if it's a link.")
                    try{
                        
                        videoInfo = await ytdl.getInfo(argument)
                        
                        msg.guild.player.songqueue.push(argument)
                        msg.guild.player.songtitlequeue.push(videoInfo.player_response.videoDetails.title)
                        
                    }catch(error){
                        console.log("["+msg.guild.name+"]"+"Using youtube's search engine.")
                        console.error(error)
                        try{
                            ytlinkk=await searchyt(argument)
                            videoInfo = await ytdl.getInfo(ytlinkk)
                            msg.guild.player.songqueue.push(ytlinkk)
                            msg.guild.player.songtitlequeue.push(videoInfo.player_response.videoDetails.title)
                            
                        }catch(e){
							console.log("THE ERROR AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
							console.log(e)
                            msg.reply("No playable songs found. Either you entered something that isn't on youtube or something is very wrong with the bot. Use `$die` to restart the bot and contact @LeoTheLemon#8456.")
							console.log("["+msg.guild.name+"]"+"Search engine returned nothing.")
                            break;
                        }
                    }
                }
				console.log("["+msg.guild.name+"]"+"Playing song.")
                if(msg.guild.player.playerstate){
                    msg.reply("Added to queue.")
                }
                else{
                    msg.guild.player.playerstate=true
                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                    msg.reply("Playing: "+msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
                }
            break;
            case "download":
                for(i=0; i<msg.guild.player.songqueue.length; i++){
                    try{
                        let stream=await ytdl(msg.guild.player.songqueue[i], {filter:"audioonly",highWaterMark:1<<25})
                        msg.channel.send({
							content: "File "+String(i+1)+":",
                            files: [{
                       	                attachment:stream,
                                        name: msg.guild.player.songtitlequeue[i]+".wav",
                                    }]
                            }
                        )
                    }catch(e){
                        console.log(e)
                        msg.reply("Failed to download "+msg.guild.player.songtitlequeue[i])
                    }
                }
            break;
            case "pause":
                msg.guild.player.pause()
            break;
            case "continue":
                msg.guild.player.unpause()
            break;
			case "q":
            case "queue":
                if (msg.guild.player.songtitlequeue.length==0){
                    msg.reply("Queue is empty. Add songs using the command `play`.")
                    break;
                }
                let queuestring=""
                for(i=0; i<(msg.guild.player.songtitlequeue.length); i++){
                    if(i==msg.guild.player.currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+(i+1)+". "+msg.guild.player.songtitlequeue[i]
                    if(i==msg.guild.player.currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+"\n"
                }
                try{
                    await msg.reply(queuestring)
                }catch{
                    msg.reply("Too many songs, trying to print will crash the bot. Still adding a working page-thing for the queue.")
                }
            break;
            case "clear":
                msg.guild.player.playerstate=false
                msg.guild.player.stop()
                msg.guild.player.songqueue=[]
                msg.guild.player.songtitlequeue=[]
                msg.guild.player.currentsong=0
                msg.guild.player.playerstate=false
                msg.guild.player.loopq=false
            break;
            case "fuckoff":
                try{
                    msg.guild.player.playerstate=false
                    msg.guild.player.stop()
                    msg.guild.player.songqueue=[]
                    msg.guild.player.songtitlequeue=[]
                    msg.guild.player.currentsong=0
                    msg.guild.player.loopq=false
                    msg.guild.conn.destroy()
                    msg.guild.player.playerstate=false
                }catch{
                    msg.reply("Already fucking.")
                }
            break;
            case "skip":
                if ((msg.guild.player.currentsong+1)<msg.guild.player.songqueue.length){
                    msg.guild.player.currentsong++
                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                    msg.reply("Playing: "+msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
                }else if(msg.guild.player.loopq){
                    msg.guild.player.currentsong=0
                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                    msg.reply("Playing: "+msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
                }
            break;
            case "loop":
                msg.guild.player.loopq=true
                msg.reply("Loop activated. Clear to deactivate.")
            break;
            case "move":
                tofromlist=argument.split(/ +/)
                console.log("["+msg.guild.name+"]"+"Attempting to move song.")

                if(tofromlist.length!=2){
                    msg.reply("Command usage: move [number of track to be moved] [new position of track]")
                    break;
                }
                try{
                    tofromlist[0]=parseInt(tofromlist[0])-1
                    tofromlist[1]=parseInt(tofromlist[1])-1
                    placeholder=msg.guild.player.songqueue[tofromlist[0]]
                    placetitleholder=msg.guild.player.songtitlequeue[tofromlist[0]]
                    msg.guild.player.songqueue.splice(tofromlist[0], 1)
                    msg.guild.player.songqueue.splice(tofromlist[1], 0, placeholder)
                    msg.guild.player.songtitlequeue.splice(tofromlist[0], 1)
                    msg.guild.player.songtitlequeue.splice(tofromlist[1], 0, placetitleholder)
                    
                }catch{
                    msg.reply("Command usage: move [number of track to be moved] [new position of track].")
                    break;
                }
                
            break;
            case "goto":
                try{
                    gotonum=parseInt(argument)-1
                }catch{
                    break;
                }
                if (gotonum<msg.guild.player.songqueue.length){
                    msg.guild.player.currentsong=gotonum
                    msg.guild.player.playerstate=true
                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                    msg.reply("Playing: "+msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
                }
            break;
            case "die":
                crash()
            break;
            case "remove":
                try{
                    if(msg.guild.player.songqueue.length==1){
                        msg.guild.player.playerstate=false
                        msg.guild.player.stop()
                        msg.guild.player.songqueue=[]
                        msg.guild.player.songtitlequeue=[]
                        msg.guild.player.currentsong=0
                        msg.guild.player.playerstate=false
                    }else{
                        console.log("["+msg.guild.name+"]"+"Attempting to remove song.")
                        msg.guild.player.songqueue.splice(parseInt(argument)-1, 1)
                        msg.guild.player.songtitlequeue.splice(parseInt(argument)-1, 1)
                        if((parseInt(argument)-1)<msg.guild.player.currentsong){
                            msg.guild.player.currentsong--
                        }else if((parseInt(argument)-1)==msg.guild.player.currentsong){
                            try{
                                playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                            }catch{
                                if(loop){
                                    msg.guild.player.currentsong=0
                                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                                }else{
                                    msg.reply("Queue ended.")
                                }
                            }
                        }
                    }
                        
                }catch(e){
                    msg.reply("I don't feel like it.")
                    console.log(e)
                }
            break;
	    	case "preset":
                msg.guild.player.playerstate=false
                msg.guild.player.stop()
                msg.guild.player.songqueue=[]
                msg.guild.player.songtitlequeue=[]
                msg.guild.player.currentsong=0
                msg.guild.player.playerstate=false
                msg.guild.player.loopq=false
				console.log("Attempting to play preset.")
                if (!msg.member.voice.channel){
                    msg.reply("You must be in a voice channel.")
                    break;
                }

                msg.guild.conn=joinVoiceChannel({
                    channelId: msg.member.voice.channel.id,
                    guildId: msg.guild.id,
                    adapterCreator: msg.guild.voiceAdapterCreator
                })
                msg.guild.conn.subscribe(msg.guild.player)
				msg.reply("Playing preset playlist. Link: https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf")
				maybeplaylist="https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf".replace(" ", "").replace("&", "=").replace("?", "=").split("=")
				checker=true
				for(i=0; i<maybeplaylist.length; i++){
					if(maybeplaylist[i]=="list"){
						await parseplaylist(maybeplaylist[i+1], msg)
						checker=false
						break
					}
				}
				if(checker){
					msg.reply("Failed... somehow?")
				}
				if(msg.guild.player.playerstate){
                    msg.reply("Added to queue.")
                }
                else{
                    msg.guild.player.playerstate=true
                    playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                    msg.reply("Playing: "+msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
                }
            break;
            case "halp":
                msg.reply("This bot plays youtube music (or any youtube video) in voice channels.\nCommands: \n`say` Replies to your message with what you told it to say.\n`play` Joins your voice channel and plays the selected song or adds it at the end of the queue. This command supports links, search queries and playlists.\n`pause` Pauses the current song.\n`continue` Unpauses.\n`queue` Displays the songs currently in queue.\n`clear` Clears queue and stops playing.\n`fuckoff` Fucks off.\n`goto` Plays the number of the song you entered.\n`move` Moves a song to a selected position in the queue eg. `$move 2 7` would move song from position 2 to position 7.\n`skip` Skips to the next song in the queue.\n`loop` Toggles looping the queue.\n`remove` Removes the selected song. eg. \n`download` Creates a download link for all the songs currently in queue in the form of a .wav file.\n `die` If something doesn't work, use this. Crashes the bot.\n `preset` replaces the current playlist with this preset one: https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf .")
            break;
            default:
                msg.reply("Unknown command. Type `halp` to display list of commands.")
            break;
            
        }
    }
})


async function searchyt(term){
    thingy= await search.GetListByKeyword(term)
    return thingy["items"][0]["id"]
}
async function playAudio(ytlink, playerr){
	try{
		let videoInfo=await ytdl.getInfo(ytlink)
		let audiostream = await ytdl(ytlink, {filter:"audioonly",highWaterMark:1<<25})
		let res = await createAudioResource(audiostream);
		playerr.play(res)
	}catch(e){
		console.log("Player error on audio play, kms")
		console.error(e)
		let videoInfo=await ytdl.getInfo(ytlink)
		let audiostream = await ytdl(ytlink, {filter:"audioonly",highWaterMark:1<<25})
		let res = await createAudioResource(audiostream);
		playerr.play(res)
	}
}
async function parseplaylist(arg, msg){
    playlist=await search.GetPlaylistData(arg);
    playlistitems=playlist["items"]
    console.log("Parsing a playlist.")
    for(i=0; i<playlistitems.length; i++){
        msg.guild.player.songqueue.push(playlistitems[i]["id"])
        msg.guild.player.songtitlequeue.push(playlistitems[i]["title"])
    }
}
/*function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {console.log("receiving chunk"); chunks.push(Buffer.from(chunk))});
    stream.on('error', (err) => reject(err));
    stream.on('end', () => {console.log("resovled"); resolve(Buffer.concat(chunks))});
  })
}*/
client.login(token);
