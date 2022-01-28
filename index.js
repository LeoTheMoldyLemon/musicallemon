
const discord = require('discord.js');
const { join } = require('path');
const token="ODg4NTA3NTI4MDc2NDYwMDQz.YUTtHg.iuS8xtXraf9Brx-WOTQbvqx0lGg";
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
    console.log("Message received from, msg: "+msg.content)
    console.log("Server: "+msg.guild.name)
    if (msg.content[0]=="$"){
        if(msg.member.voice.channel===undefined){
            msg.reply("Sorry, you have to be in a voice channel to talk to me.")
        }else{
            if(msg.member.voice.channel.player === undefined){
                msg.member.voice.channel.player = createAudioPlayer()
                msg.member.voice.channel.player.songqueue=[]
                msg.member.voice.channel.player.songtitlequeue=[]
                msg.member.voice.channel.player.currentsong=0
                msg.member.voice.channel.player.playerstate=false
                msg.member.voice.channel.player.loopq=false
                msg.member.voice.channel.player.on('error', error => {
                    console.log("Error player.", error);
                });
                playerrr=msg.member.voice.channel.player
                
                playerEventHandler=function(){
                    console.log(playerrr);
                
                
                
                
                
                    console.log("Player is idle.")
                    
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
                
                msg.member.voice.channel.player.on(AudioPlayerStatus.Idle, playerEventHandler.bind(playerrr) )
                
                
                
                
                
                
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
                case "play":
                    console.log("CHECK1")
                    if (!msg.member.voice.channel){
                        msg.reply("You must be in a voice channel.")
                        break;
                    }
                    console.log("CHECK2")
                    conn=joinVoiceChannel({
                        channelId: msg.member.voice.channel.id,
                        guildId: msg.guild.id,
                        adapterCreator: msg.guild.voiceAdapterCreator
                    })
                    conn.subscribe(msg.member.voice.channel.player)
                    console.log("CHECK3")
                    try{
                        
                        
                        maybeplaylist=argument.replace(" ", "").replace("&", "=").replace("?", "=").split("=")
                        console.log(maybeplaylist)
                        checker=true
                        for(i=0; i<maybeplaylist.length; i++){
                            if(maybeplaylist[i]=="list"){
                                await parseplaylist(maybeplaylist[i+1], msg)
                                console.log(maybeplaylist[i+1])
                                checker=false
                                break
                            }
                        }
                        if(checker){
                            a=asdfjo()
                        }
                        
                    }catch (error){
                        console.error(error)
                        try{
                            ytlinkk=await searchyt(argument)
                            videoInfo = await ytdl.getInfo(ytlinkk)
                            msg.member.voice.channel.player.songqueue.push(ytlinkk)
                            msg.member.voice.channel.player.songtitlequeue.push(videoInfo.player_response.videoDetails.title)
                            
                        }catch{
                            msg.reply("No playable songs found.")
                            break;
                        }
                    }
                    console.log("CHECK4")
                    if(msg.member.voice.channel.player.playerstate){
                        msg.reply("Added to queue.")
                    }
                    else{
                        msg.member.voice.channel.player.playerstate=true
                        playAudio(msg.member.voice.channel.player.songqueue[msg.member.voice.channel.player.currentsong], msg.member.voice.channel.player)
                        msg.reply("Playing: "+msg.member.voice.channel.player.songtitlequeue[msg.member.voice.channel.player.currentsong])
                    }
                break;
                case "pause":
                    msg.member.voice.channel.player.pause()
                break;
                case "continue":
                    msg.member.voice.channel.player.unpause()
                break;
                case "queue":
                    if (msg.member.voice.channel.player.songtitlequeue.length==0){
                        msg.reply("Queue is empty. Add songs using the command `play`.")
                        break;
                    }
                    let queuestring=""
                    for(i=0; i<(msg.member.voice.channel.player.songtitlequeue.length); i++){
                        if(i==msg.member.voice.channel.player.currentsong){
                            queuestring=queuestring+"**"
                        }
                        queuestring=queuestring+(i+1)+". "+msg.member.voice.channel.player.songtitlequeue[i]
                        if(i==msg.member.voice.channel.player.currentsong){
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
                    msg.member.voice.channel.player.playerstate=false
                    msg.member.voice.channel.player.stop()
                    msg.member.voice.channel.player.songqueue=[]
                    msg.member.voice.channel.player.songtitlequeue=[]
                    msg.member.voice.channel.player.currentsong=0
                    msg.member.voice.channel.player.playerstate=false
                break;
                case "fuckoff":
                    try{
                        msg.member.voice.channel.player.playerstate=false
                        msg.member.voice.channel.player.stop()
                        msg.member.voice.channel.player.songqueue=[]
                        msg.member.voice.channel.player.songtitlequeue=[]
                        msg.member.voice.channel.player.currentsong=0
                        conn.destroy()
                        msg.member.voice.channel.player.playerstate=false
                    }catch{
                        msg.reply("Already fucking.")
                    }
                break;
                case "skip":
                    if ((msg.member.voice.channel.player.currentsong+1)<msg.member.voice.channel.player.songqueue.length){
                        msg.member.voice.channel.player.currentsong++
                        playAudio(msg.member.voice.channel.player.songqueue[msg.member.voice.channel.player.currentsong], msg.member.voice.channel.player)
                        msg.reply("Playing: "+msg.member.voice.channel.player.songtitlequeue[msg.member.voice.channel.player.currentsong])
                    }else if(msg.member.voice.channel.player.loopq){
                        msg.member.voice.channel.player.currentsong=0
                        playAudio(msg.member.voice.channel.player.songqueue[msg.member.voice.channel.player.currentsong], msg.member.voice.channel.player)
                        msg.reply("Playing: "+msg.member.voice.channel.player.songtitlequeue[msg.member.voice.channel.player.currentsong])
                    }
                break;
                case "loop":
                    msg.member.voice.channel.player.loopq=!msg.member.voice.channel.player.loopq
                    msg.reply("Loop: "+msg.member.voice.channel.player.loopq)
                break;
                case "move":
                    tofromlist=argument.split(/ +/)
                    console.log(argument)
                    console.log(tofromlist)
                    if(tofromlist.length!=2){
                        msg.reply("Command usage: move [number of track to be moved] [new position of track]")
                        break;
                    }
                    try{
                        tofromlist[0]=parseInt(tofromlist[0])-1
                        tofromlist[1]=parseInt(tofromlist[1])-1
                        placeholder=msg.member.voice.channel.player.songqueue[tofromlist[0]]
                        placetitleholder=msg.member.voice.channel.player.songtitlequeue[tofromlist[0]]
                        msg.member.voice.channel.player.songqueue.splice(tofromlist[0], 1)
                        msg.member.voice.channel.player.songqueue.splice(tofromlist[1], 0, placeholder)
                        msg.member.voice.channel.player.songtitlequeue.splice(tofromlist[0], 1)
                        msg.member.voice.channel.player.songtitlequeue.splice(tofromlist[1], 0, placetitleholder)
                        
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
                    if (gotonum<msg.member.voice.channel.player.songqueue.length){
                        msg.member.voice.channel.player.currentsong=gotonum
                        msg.member.voice.channel.player.playerstate=true
                        playAudio(msg.member.voice.channel.player.songqueue[msg.member.voice.channel.player.currentsong], msg.member.voice.channel.player)
                        msg.reply("Playing: "+msg.member.voice.channel.player.songtitlequeue[msg.member.voice.channel.player.currentsong])
                    }
                break;
                case "remove":
                    try{
                        if(msg.member.voice.channel.player.songqueue.length==1){
                            msg.member.voice.channel.player.playerstate=false
                            msg.member.voice.channel.player.stop()
                            msg.member.voice.channel.player.songqueue=[]
                            msg.member.voice.channel.player.songtitlequeue=[]
                            msg.member.voice.channel.player.currentsong=0
                            msg.member.voice.channel.player.playerstate=false
                        }else{
                            console.log(argument)
                            msg.member.voice.channel.player.songqueue.splice(parseInt(argument)-1, 1)
                            msg.member.voice.channel.player.songtitlequeue.splice(parseInt(argument)-1, 1)
                            if(argument<msg.member.voice.channel.player.currentsong){
                                currentsong--
                            }else if(argument==msg.member.voice.channel.player.currentsong){
                                playAudio(msg.member.voice.channel.player.songqueue[msg.member.voice.channel.player.currentsong], msg.member.voice.channel.player)
                            }
                        }
                            
                    }catch(e){
                        msg.reply("I don't feel like it.")
                        console.log(e)
                    }
                break;
                case "halp":
                    msg.reply("This bot plays youtube music (or any video) in voice channels.\nCommands: \n`say` Replies to your message with what you told it to say.\n`play` Joins your voice channel and play the selected song or add it at the end of the queue. This command supports links, search querys and playlists.\n`pause` Pauses the current song.\n`continue` Unpauses.\n`queue` Displays songs in the queue.\n`clear` Clears queue and stops playing.\n`fuckoff` Fucks off.\n`goto` Plays the number of the song you entered.\n`move` Moves a song to a selected position in the queue.\n`skip` Skips to the next song in the queue.\n`loop` Toggles looping the queue.\n`remove` Removes the selected song.")
                break;
                default:
                    msg.reply("Unknown command. Type `halp` to display list of commands.")
                break;
                
            }
        }
    }
})


async function searchyt(term){
    thingy= await search.GetListByKeyword(term)
    return thingy["items"][0]["id"]
}
async function playAudio(ytlink, playerr){
    let videoInfo=await ytdl.getInfo(ytlink)
    let audiostream = await ytdl(ytlink, {filter:"audioonly",highWaterMark:1<<25})
    let res = await createAudioResource(audiostream);
    playerr.play(res)
}
async function parseplaylist(arg, msg){
    playlist=await search.GetPlaylistData(arg);
    playlistitems=playlist["items"]
    console.log(playlistitems)
    for(i=0; i<playlistitems.length; i++){
        msg.member.voice.channel.player.songqueue.push(playlistitems[i]["id"])
        msg.member.voice.channel.player.songtitlequeue.push(playlistitems[i]["title"])
    }
}
client.login(token);
