
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





client.on("messageCreate", async (msg)=>{
    console.log("Message received from, msg: "+msg.content)
    console.log("Server: "+msg.guild.name)
    if (msg.content[0]=="$"){
        if(msg.guild.songqueue === undefined){
            msg.guild.songqueue=[]
            msg.guild.songtitlequeue=[]
            msg.guild.currentsong=0
            msg.guild.playerstate=false
            msg.guild.loopq=false
            const msg.guild.player = createAudioPlayer()
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
                if (!msg.member.voice.channel){
                    msg.reply("You must be in a voice channel.")
                    break;
                }
                conn=joinVoiceChannel({
                    channelId: msg.member.voice.channel.id,
                    guildId: msg.guild.id,
                    adapterCreator: msg.guild.voiceAdapterCreator
                }).subscribe(msg.guild.player)
                try{
                    maybeplaylist=argument.split("list=")[1].replace(" ", "")
                    await parseplaylist(maybeplaylist)
                    
                }catch{
                    try{
                        ytlinkk=await searchyt(argument)
                        videoInfo = await ytdl.getInfo(ytlinkk)
                        msg.guild.songqueue.push(ytlinkk)
                        msg.guild.songtitlequeue.push(videoInfo.player_response.videoDetails.title)
                        
                    }catch{
                        msg.reply("No playable songs found.")
                        break;
                    }
                }
                if(msg.guild.playerstate){
                    msg.reply("Added to queue.")
                }
                else{
                    msg.guild.playerstate=true
                    playAudio(msg.guild.songqueue[msg.guild.currentsong])
                    msg.reply("Playing: "+msg.guild.songtitlequeue[msg.guild.currentsong])
                }
            break;
            case "pause":
                msg.guild.player.pause()
            break;
            case "continue":
                msg.guild.player.unpause()
            break;
            case "queue":
                if (msg.guild.songtitlequeue.length==0){
                    msg.reply("Queue is empty. Add songs using the command `play`.")
                    break;
                }
                let queuestring=""
                for(i=0; i<(msg.guild.songtitlequeue.length); i++){
                    if(i==msg.guild.currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+(i+1)+". "+msg.guild.songtitlequeue[i]
                    if(i==msg.guild.currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+"\n"
                }
                msg.reply(queuestring)
            break;
            case "clear":
                msg.guild.playerstate=false
                msg.guild.player.stop()
                msg.guild.songqueue=[]
                msg.guild.songtitlequeue=[]
                msg.guild.currentsong=0
                msg.guild.playerstate=false
            break;
            case "fuckoff":
                try{
                    msg.guild.playerstate=false
                    msg.guild.player.stop()
                    msg.guild.songqueue=[]
                    msg.guild.songtitlequeue=[]
                    msg.guild.currentsong=0
                    conn.destroy()
                    msg.guild.playerstate=false
                }catch{
                    msg.reply("Already fucking.")
                }
            break;
            case "skip":
                if ((msg.guild.currentsong+1)<msg.guild.songqueue.length){
                    msg.guild.currentsong++
                    playAudio(msg.guild.songqueue[msg.guild.currentsong])
                    msg.reply("Playing: "+msg.guild.songtitlequeue[msg.guild.currentsong])
                }else if(msg.guild.loopq){
                    msg.guild.currentsong=0
                    playAudio(msg.guild.songqueue[msg.guild.currentsong])
                    msg.reply("Playing: "+msg.guild.songtitlequeue[msg.guild.currentsong])
                }
            break;
            case "loop":
                msg.guild.loopq=!msg.guild.loopq
                msg.reply("Loop: "+msg.guild.loopq)
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
                    placeholder=msg.guild.songqueue[tofromlist[0]]
                    placetitleholder=msg.guild.songtitlequeue[tofromlist[0]]
                    msg.guild.songqueue.splice(tofromlist[0], 1)
                    msg.guild.songqueue.splice(tofromlist[1], 0, placeholder)
                    msg.guild.songtitlequeue.splice(tofromlist[0], 1)
                    msg.guild.songtitlequeue.splice(tofromlist[1], 0, placetitleholder)
                    
                }catch{
                    msg.reply("Command usage: move [number of track to be moved] [new position of track].")
                    break;
                }
                
            break;
            case "goto":
                try{
                    gotonum=parseInt(argument)
                }catch{
                    break;
                }
                if (gotonum<msg.guild.songqueue.length){
                    msg.guild.currentsong=gotonum
                    msg.guild.playerstate=true
                    playAudio(msg.guild.songqueue[msg.guild.currentsong])
                    msg.reply("Playing: "+msg.guild.songtitlequeue[msg.guild.currentsong])
                }
            break;
            case "halp":
                msg.reply("This bot plays youtube music (or any video) in voice channels.\nCommands: \n`say` Replies to your message with what you told it to say.\n`play` Joins your voice channel and play the selected song or add it at the end of the queue. This command supports links, search querys and playlists.\n`pause` Pauses the current song.\n`continue` Unpauses.\n`queue` Displays songs in the queue.\n`clear` Clears queue and stops playing.\n`fuckoff` Fucks off.\n`goto` Plays the number of the song you entered.\n`move` Moves a song to a selected position in the queue.\n`skip` Skips to the next song in the queue.\n`loop` Toggles looping the queue.")
            break;
            default:
                msg.reply("Unknown command. Type `halp` to display list of commands.")
            break;
            
        }
    }
})
msg.guild.player.on(AudioPlayerStatus.Idle, () => {
    if(msg.guild.playerstate){
        if ((msg.guild.currentsong+1)<msg.guild.songqueue.length){
            msg.guild.currentsong++
            playAudio(msg.guild.songqueue[msg.guild.currentsong])
        }else{
            if(msg.guild.loopq){
                msg.guild.currentsong=0
                playAudio(msg.guild.songqueue[msg.guild.currentsong])
                msg.reply("Playing: "+msg.guild.songtitlequeue[msg.guild.currentsong])
            }else{
                msg.guild.currentsong++
                msg.guild.playerstate=false
            }
        }
    }
});

async function searchyt(term){
    thingy= await search.GetListByKeyword(term)
    return thingy["items"][0]["id"]
}
async function playAudio(ytlink){
    let videoInfo=await ytdl.getInfo(ytlink)
    let audiostream = await ytdl(ytlink, {filter:"audioonly"})
    let res = createAudioResource(audiostream);
    msg.guild.player.play(res)
}
async function parseplaylist(arg){
    playlist=await search.GetPlaylistData(arg);
    playlistitems=playlist["items"]
    for(i=0; i<playlistitems.length; i++){
        msg.guild.songqueue.push(playlistitems[i]["id"])
        msg.guild.songtitlequeue.push(playlistitems[i]["title"])
    }
}
client.login(token);
