
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

const player = createAudioPlayer()
songqueue=[]
songtitlequeue=[]
currentsong=0
playerstate=false
loopq=false
client.on("messageCreate", async (msg)=>{
    console.log("Message received, msg: "+msg.content)
    if (msg.content[0]=="$"){
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
                }).subscribe(player)
                try{
                    maybeplaylist=argument.split("list=")[1].replace(" ", "")
                    await parseplaylist(maybeplaylist)
                    
                }catch{
                    try{
                        ytlinkk=await searchyt(argument)
                        videoInfo = await ytdl.getInfo(ytlinkk)
                        songqueue.push(ytlinkk)
                        songtitlequeue.push(videoInfo.player_response.videoDetails.title)
                        
                    }catch{
                        msg.reply("No playable songs found.")
                        break;
                    }
                }
                if(playerstate){
                    msg.reply("Added to queue.")
                }
                else{
                    playerstate=true
                    playAudio(songqueue[currentsong])
                    msg.reply("Playing: "+songtitlequeue[currentsong])
                }
            break;
            case "pause":
                player.pause()
            break;
            case "continue":
                player.unpause()
            break;
            case "queue":
                if (songtitlequeue.length==0){
                    msg.reply("Queue is empty. Add songs using the command `play`.")
                    break;
                }
                let queuestring=""
                for(i=0; i<(songtitlequeue.length); i++){
                    if(i==currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+(i+1)+". "+songtitlequeue[i]
                    if(i==currentsong){
                        queuestring=queuestring+"**"
                    }
                    queuestring=queuestring+"\n"
                }
                msg.reply(queuestring)
            break;
            case "clear":
                playerstate=false
                player.stop()
                songqueue=[]
                songtitlequeue=[]
                currentsong=0
                playerstate=false
            break;
            case "fuckoff":
                try{
                    playerstate=false
                    player.stop()
                    songqueue=[]
                    songtitlequeue=[]
                    currentsong=0
                    conn.destroy()
                    playerstate=false
                }catch{
                    msg.reply("Already fucking.")
                }
            break;
            case "skip":
                if ((currentsong+1)<songqueue.length){
                    currentsong++
                    playAudio(songqueue[currentsong])
                    msg.reply("Playing: "+songtitlequeue[currentsong])
                }else if(loopq){
                    currentsong=0
                    playAudio(songqueue[currentsong])
                    msg.reply("Playing: "+songtitlequeue[currentsong])
                }
            break;
            case "loop":
                loopq=!loopq
                msg.reply("Loop: "+loopq)
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
                    placeholder=songqueue[tofromlist[0]]
                    placetitleholder=songtitlequeue[tofromlist[0]]
                    songqueue.splice(tofromlist[0], 1)
                    songqueue.splice(tofromlist[1], 0, placeholder)
                    songtitlequeue.splice(tofromlist[0], 1)
                    songtitlequeue.splice(tofromlist[1], 0, placetitleholder)
                    
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
                if (gotonum<songqueue.length){
                    currentsong=gotonum
                    playerstate=true
                    playAudio(songqueue[currentsong])
                    msg.reply("Playing: "+songtitlequeue[currentsong])
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
player.on(AudioPlayerStatus.Idle, () => {
    if(playerstate){
        if ((currentsong+1)<songqueue.length){
            currentsong++
            playAudio(songqueue[currentsong])
        }else{
            if(loopq){
                currentsong=0
                playAudio(songqueue[currentsong])
                msg.reply("Playing: "+songtitlequeue[currentsong])
            }else{
                currentsong++
                playerstate=false
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
    player.play(res)
}
async function parseplaylist(arg){
    playlist=await search.GetPlaylistData(arg);
    playlistitems=playlist["items"]
    for(i=0; i<playlistitems.length; i++){
        songqueue.push(playlistitems[i]["id"])
        songtitlequeue.push(playlistitems[i]["title"])
    }
}
client.login(token);
