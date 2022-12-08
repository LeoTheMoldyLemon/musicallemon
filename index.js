const discord = require('discord.js');
const { join } = require('path');
const { get } = require("https");
const token = process.env.token;
const intents = new discord.Intents(130809);
const ytdl = require('ytdl-core');
const client = new discord.Client({ intents });
const fs = require("fs");
client.on('debug', logit).on("warn", logit).on("rateLimit", logit);
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice')

function saveForRestart(msg) {
  console.log("Saved for restart " + msg.guild.name)
  fs.readFile("queue.json", "utf8", (err, data) => {
    let msgData = JSON.parse(data)

    msgData[msg.guild.id] = msg
    fs.writeFile("queue.json", JSON.stringify(msgData), () => { })
  })
}
function deleteForRestart(msg) {
  fs.readFile("queue.json", "utf8", (err, data) => {
    let msgData = JSON.parse(data)
    delete msgData[msg.guild.id]
    fs.writeFile("queue.json", JSON.stringify(msgData), () => { })
  })
}







let time = new Date(Date.now());
fs.rename("log.txt", "logs/" + time.toUTCString() + ".txt", () => { })
const logfile = new console.Console(fs.createWriteStream('./log.txt'));
function logit(log) {
  let time = new Date(Date.now());
  console.log(time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + " > " + log);
  logfile.log(time.toUTCString() + " > " + log + "\n");
}
logit('Starting!');
const search = require('youtube-search-api');
client.on('ready', () => {
  fs.readFile("queue.json", "utf8", async (err, data) => {
    let msgData = JSON.parse(data)
    for (key of Object.keys(msgData)) {
      if (msgData[key] == null) {
        continue
      }
      logit()
      let chan = await client.channels.cache.get(msgData[key].channelId)
      let mess = await chan.messages.fetch(msgData[key].id)

      mess.reply("Forced restart, sorry for clearing your playlist. Bot is online now.")
      delete msgData[key]
    }
    fs.writeFile("queue.json", JSON.stringify(msgData), () => { })
  })
  logit('Ready!');
});
function handleRateLimit() {
  get(`https://discord.com/api/v10/gateway`, ({ statusCode }) => {
    if (statusCode == 429) {
      logit("RESETTING CAUSE 429")
      process.kill(1)
    }
  });
};
handleRateLimit();
setInterval(handleRateLimit, 3e5); //3e5 = 300000 (3 w/ 5 zeros)
client.on('error', error => {
  logit('The WebSocket encountered an error: ' + error.toString());
});



client.on("messageCreate", async (msg) => {
  logit("[" + msg.guild.name + "] " + msg.author.username + ": " + msg.content)
  logit(msg)

  if (msg.content[0] == "#") {
    if (msg.guild.player === undefined) {
      msg.guild.player = createAudioPlayer()
      msg.guild.player.songqueue = []
      msg.guild.player.songtitlequeue = []
      msg.guild.player.currentsong = 0
      msg.guild.player.playerstate = false
      msg.guild.player.loopq = false
      msg.guild.player.on('error', error => {
        logit("[" + msg.guild.name + "]" + "Error player: " + error.toString());
        msg.guild.player.currentsong--
      });
      let playerrr = msg.guild.player

      playerEventHandler = function() {






        if (this.playerstate) {
          if ((this.currentsong + 1) < this.songqueue.length) {
            this.currentsong++
            playAudio(this.songqueue[this.currentsong], this)
          } else {
            if (this.loopq) {
              this.currentsong = 0
              playAudio(this.songqueue[this.currentsong], this)
            } else {
              this.currentsong++
              this.playerstate = false
              logit("[" + msg.guild.name + "]" + "Player is idle.")

            }
          }
        }
      };

      msg.guild.player.on(AudioPlayerStatus.Idle, playerEventHandler.bind(playerrr))






    }
    command = msg.content.substring(1).split(/ +/);
    argument = ""
    for (i = 1; i < (command.length); i++) {
      argument = argument + command[i]
      if (i != (command.length - 1)) {
        argument = argument + " "
      }
    }
    switch (command[0]) {
      case "say":
        msg.reply(argument)
        break;
      case "cp":
        msg.guild.player.playerstate = false
        msg.guild.player.stop()
        msg.guild.player.songqueue = []
        msg.guild.player.songtitlequeue = []
        msg.guild.player.currentsong = 0
        msg.guild.player.playerstate = false
        msg.guild.player.loopq = false
      case "p":
      case "play":
        logit("[" + msg.guild.name + "]" + "Attempting to play a song.")
        if (!msg.member.voice.channel) {
          msg.reply("You must be in a voice channel.")
          logit("[" + msg.guild.name + "]" + "User wasn't in voice channel.")
          break;
        }
        if (argument == "" || argument == null) {
          msg.reply("You need to insert the name of the song after the command. eg. `$cp Never Gonna Give You Up`, `$play We Are Number One`, `$p Enjoy The Silence`")
          logit("[" + msg.guild.name + "]" + "No song name.")
          break;
        }

        msg.guild.conn = joinVoiceChannel({
          channelId: msg.member.voice.channel.id,
          guildId: msg.guild.id,
          adapterCreator: msg.guild.voiceAdapterCreator
        })
        msg.guild.conn.subscribe(msg.guild.player)

        saveForRestart(msg)
        try {


          maybeplaylist = argument.replace(" ", "").replace("&", "=").replace("?", "=").split("=")
          logit("[" + msg.guild.name + "]" + "Checkin if it's a playlist.")
          checker = true
          for (i = 0; i < maybeplaylist.length; i++) {
            if (maybeplaylist[i] == "list") {
              await parseplaylist(maybeplaylist[i + 1], msg)
              checker = false
              break
            }
          }
          if (checker) {
            a = asdfjo()
          }
          saveForRestart(msg)
        } catch (error) {
          logit("[" + msg.guild.name + "]" + "Checking if it's a link.")
          try {

            videoInfo = await ytdl.getInfo(argument)

            msg.guild.player.songqueue.push(argument)
            msg.guild.player.songtitlequeue.push(videoInfo.player_response.videoDetails.title)
            saveForRestart(msg)
          } catch (error) {
            logit("[" + msg.guild.name + "]" + "Using youtube's search engine.")
            logit(error.toString())
            try {
              ytlinkk = await searchyt(argument)
              videoInfo = await ytdl.getInfo(ytlinkk)
              msg.guild.player.songqueue.push(ytlinkk)
              msg.guild.player.songtitlequeue.push(videoInfo.player_response.videoDetails.title)

            } catch (e) {

              logit("THE ERROR AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
              logit(e.toString())
              msg.reply("A little hiccup happened due to this bot pulling stuff of off youtube in a not exactly 100% legal way, unfortunately, because of this, it has to restart. This is (should be) pretty rare and if you try playing something now it *should* work. Sorry for the inconvience.")
              logit("RESETTING CAUSE 410")
              logit("[" + msg.guild.name + "]" + "Search engine returned nothing.")

              process.kill(1)



              break;
            }
          }
        }
        logit("[" + msg.guild.name + "]" + "Playing song.")
        saveForRestart(msg)
        if (msg.guild.player.playerstate) {
          msg.reply("Added to queue.")
        }
        else {
          msg.guild.player.playerstate = true
          playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
          msg.reply("Playing: " + msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
        }
        break;
      case "download":
        msg.reply("Attempting download, give me a few minutes. If I become unresposnive, try `die`.");
        for (let i = 0; i < msg.guild.player.songqueue.length; i++) {
          try {
            let stream = await ytdl(msg.guild.player.songqueue[i], { filter: "audioonly", highWaterMark: 1 << 25 })
            stream.index = i;
            stream.pipe(await fs.createWriteStream("audio.wav"));
            streamEndEvent = function() {

              msg.channel.send({
                content: "File " + (this.index + 1).toString() + ":",
                files: [{
                  attachment: "audio.wav",
                  name: msg.guild.player.songtitlequeue[this.index] + ".wav",
                }]
              }
              )
            }



            stream.on("end", streamEndEvent.bind(stream))
          } catch (e) {
            logit(e.toString())
            msg.reply("Failed to download " + msg.guild.player.songtitlequeue[i])
          }
        }
        break;
      case "pause":
        msg.guild.player.pause()
        break;
      case "resume":
      case "continue":
      case "unpause":
        msg.guild.player.unpause()
        break;
      case "q":
      case "queue":
        if (msg.guild.player.songtitlequeue.length == 0) {
          msg.reply("Queue is empty. Add songs using the command `play`.")
          break;
        }
        /*let queuestring = ""
        for (i = 0; i < (msg.guild.player.songtitlequeue.length); i++) {
          if (i == msg.guild.player.currentsong) {
            queuestring = queuestring + "**"
          }
          queuestring = queuestring + (i + 1) + ". " + msg.guild.player.songtitlequeue[i]
          if (i == msg.guild.player.currentsong) {
            queuestring = queuestring + "**"
          }
          queuestring = queuestring + "\n"
        }/*
        try {
          await msg.reply(queuestring)
        } catch {
          msg.reply("Too many songs, trying to print will crash the bot. Still adding a working page-thing for the queue. You can check out the queue [here](https://musicalorange.leothemoldylemo.repl.co/)")
          
        }*/
        let qmsg=await msg.reply("Loading queue.")
        logit(qmsg)
        let filter = (reaction, user) => {
          //return true
          
        	return ((reaction.emoji.name === '⏪' || reaction.emoji.name === '⏩' || reaction.emoji.name === '◀️' || reaction.emoji.name === '▶️' || reaction.emoji.name === '🔄') && !user.bot);
        };
        
         qmsg.collector = qmsg.createReactionCollector( {filter, max: 100});
        
        qmsg.page=1
        qmsg.collector.on('collect', async (reaction, user) => {
          logit("collected "+reaction.emoji.name.toString())
          if(reaction.emoji.name === '▶️'){
            qmsg.page++
          }else if(reaction.emoji.name === '◀️'){
            qmsg.page--
          }else if(reaction.emoji.name === '⏪'){
            qmsg.page=1
          }else if(reaction.emoji.name === '⏩'){
            qmsg.page=Math.ceil(msg.guild.player.songqueue.length/10)
          }
          qmsg.page=Math.min(Math.max(1, qmsg.page),Math.ceil(msg.guild.player.songqueue.length/10))
          logit(qmsg.page)
          await qmsg.edit(await generateQueueText(qmsg.page, msg.guild.player.songtitlequeue, msg.guild.player.currentsong))
          await qmsg.reactions.removeAll().then(() => qmsg.react('⏪')).then(() => qmsg.react('◀️')).then(() => qmsg.react('🔄')).then(() => qmsg.react('▶️')).then(() => qmsg.react('⏩'))
        });
        logit("almost there!")
        await qmsg.edit(await generateQueueText(qmsg.page, msg.guild.player.songtitlequeue, msg.guild.player.currentsong))
        await qmsg.reactions.removeAll().then(() => qmsg.react('⏪')).then(() => qmsg.react('◀️')).then(() => qmsg.react('🔄')).then(() => qmsg.react('▶️')).then(() => qmsg.react('⏩'))
        logit("DONE")
      
        
        break;
      case "c":
      case "clear":
        msg.guild.player.playerstate = false
        msg.guild.player.stop()
        msg.guild.player.songqueue = []
        msg.guild.player.songtitlequeue = []
        msg.guild.player.currentsong = 0
        msg.guild.player.playerstate = false
        msg.guild.player.loopq = false
        break;
      case "fuckoff":
        try {
          msg.guild.player.playerstate = false
          msg.guild.player.stop()
          msg.guild.player.songqueue = []
          msg.guild.player.songtitlequeue = []
          msg.guild.player.currentsong = 0
          msg.guild.player.loopq = false
          msg.guild.conn.destroy()
          msg.guild.player.playerstate = false
          deleteForRestart(msg)
        } catch {
          msg.reply("Already fucking.")
        }
        break;
      case "skip":
        if ((msg.guild.player.currentsong + 1) < msg.guild.player.songqueue.length) {
          msg.guild.player.currentsong++
          playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
          msg.reply("Playing: " + msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
        } else if (msg.guild.player.loopq) {
          msg.guild.player.currentsong = 0
          playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
          msg.reply("Playing: " + msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
        }
        break;
      case "loop":
        msg.guild.player.loopq = true
        msg.reply("Loop activated. Clear to deactivate.")
        break;
      case "move":
        tofromlist = argument.split(/ +/)
        logit("[" + msg.guild.name + "]" + "Attempting to move song.")

        if (tofromlist.length != 2) {
          msg.reply("Command usage: move [number of track to be moved] [new position of track]")
          break;
        }
        try {
          tofromlist[0] = parseInt(tofromlist[0]) - 1
          tofromlist[1] = parseInt(tofromlist[1]) - 1
          placeholder = msg.guild.player.songqueue[tofromlist[0]]
          placetitleholder = msg.guild.player.songtitlequeue[tofromlist[0]]
          msg.guild.player.songqueue.splice(tofromlist[0], 1)
          msg.guild.player.songqueue.splice(tofromlist[1], 0, placeholder)
          msg.guild.player.songtitlequeue.splice(tofromlist[0], 1)
          msg.guild.player.songtitlequeue.splice(tofromlist[1], 0, placetitleholder)

        } catch {
          msg.reply("Command usage: move [number of track to be moved] [new position of track].")
          break;
        }

        break;
      case "goto":
        try {
          gotonum = parseInt(argument) - 1
        } catch {
          break;
        }
        if (gotonum < msg.guild.player.songqueue.length) {
          msg.guild.player.currentsong = gotonum
          msg.guild.player.playerstate = true
          playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
          msg.reply("Playing: " + msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
        }
        break;
      case "die":
        process.kill(1)
        break;
      case "remove":
        try {
          if (msg.guild.player.songqueue.length == 1) {
            msg.guild.player.playerstate = false
            msg.guild.player.stop()
            msg.guild.player.songqueue = []
            msg.guild.player.songtitlequeue = []
            msg.guild.player.currentsong = 0
            msg.guild.player.playerstate = false
          } else {
            logit("[" + msg.guild.name + "]" + "Attempting to remove song.")
            msg.guild.player.songqueue.splice(parseInt(argument) - 1, 1)
            msg.guild.player.songtitlequeue.splice(parseInt(argument) - 1, 1)
            if ((parseInt(argument) - 1) < msg.guild.player.currentsong) {
              msg.guild.player.currentsong--
            } else if ((parseInt(argument) - 1) == msg.guild.player.currentsong) {
              try {
                playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
              } catch {
                if (loop) {
                  msg.guild.player.currentsong = 0
                  playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
                } else {
                  msg.reply("Queue ended.")
                }
              }
            }
          }

        } catch (e) {
          msg.reply("I don't feel like it.")
          logit(e.toString())
        }
        break;
      case "preset":
        msg.guild.player.playerstate = false
        msg.guild.player.stop()
        msg.guild.player.songqueue = []
        msg.guild.player.songtitlequeue = []
        msg.guild.player.currentsong = 0
        msg.guild.player.playerstate = false
        msg.guild.player.loopq = false
        logit("Attempting to play preset.")
        if (!msg.member.voice.channel) {
          msg.reply("You must be in a voice channel.")
          break;
        }

        msg.guild.conn = joinVoiceChannel({
          channelId: msg.member.voice.channel.id,
          guildId: msg.guild.id,
          adapterCreator: msg.guild.voiceAdapterCreator
        })
        msg.guild.conn.subscribe(msg.guild.player)
        msg.reply("Playing preset playlist. Link: https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf")
        maybeplaylist = "https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf".replace(" ", "").replace("&", "=").replace("?", "=").split("=")
        checker = true
        for (i = 0; i < maybeplaylist.length; i++) {
          if (maybeplaylist[i] == "list") {
            await parseplaylist(maybeplaylist[i + 1], msg)
            checker = false
            break
          }
        }
        if (checker) {
          msg.reply("Failed... somehow?")
        }
        if (msg.guild.player.playerstate) {
          msg.reply("Added to queue.")
        }
        else {
          msg.guild.player.playerstate = true
          playAudio(msg.guild.player.songqueue[msg.guild.player.currentsong], msg.guild.player)
          msg.reply("Playing: " + msg.guild.player.songtitlequeue[msg.guild.player.currentsong])
        }
        break;
      case "halp":
        msg.reply("This bot plays youtube music (or any youtube video) in voice channels.\nCommands: \n`say` Replies to your message with what you told it to say.\n`play` or `p` (or `cp`, which also clears the queue) Joins your voice channel and plays the selected song or adds it at the end of the queue. This command supports links, search queries and playlists.\n`pause` Pauses the current song.\n`continue` or `resume` or `unpause` Unpauses.\n`queue` or `q` Displays the songs currently in queue.\n`clear` or `c` Clears queue and stops playing.\n`fuckoff` Fucks off.\n`goto` Plays the number of the song you entered.\n`move` Moves a song to a selected position in the queue eg. `$move 2 7` would move song from position 2 to position 7.\n`skip` Skips to the next song in the queue.\n`loop` Toggles looping the queue.\n`remove` Removes the selected song. eg. `$remove 2` removes the second song in queue. \n`download` Creates a download link for all the songs currently in queue in the form of a .wav file. (Downloading longer videos(20+min) might take a minute or two, do not download 10 hour vids, I paid for just 1GB cloud storage)\n `die` If something doesn't work, use this. Crashes the bot and resets it. Repetitive use may cause the bot to not start on it's own again, in that case contact me (LeoTheLemon#8456)\n `preset` replaces the current playlist with this preset one: https://www.youtube.com/playlist?list=PLxDvibNajH61yTpWe0LzE-O5e-BuE8bMf .")
        break;
      default:
        msg.reply("Unknown command. Type `halp` to display list of commands.")
        break;

    }
  }
})


async function searchyt(term) {
  let thingy = await search.GetListByKeyword(term, false, 1, [{ type: "video" }])
  return thingy["items"][0]["id"]
}
async function playAudio(ytlink, playerr) {
  try {
    let videoInfo = await ytdl.getInfo(ytlink)
    let audiostream = await ytdl(ytlink, { filter: "audioonly", highWaterMark: 1 << 27 })
    let res = await createAudioResource(audiostream);
    playerr.play(res)
  } catch (e) {
    logit("Player error on audio play, kms")
    logit(e.toString())
    let videoInfo = await ytdl.getInfo(ytlink)
    let audiostream = await ytdl(ytlink, { filter: "audioonly", highWaterMark: 1 << 27 })
    let res = await createAudioResource(audiostream);
    playerr.play(res)
  }
}
async function parseplaylist(arg, msg) {
  playlist = await search.GetPlaylistData(arg);
  playlistitems = playlist["items"]
  logit("Parsing a playlist.")
  for (i = 0; i < playlistitems.length; i++) {
    msg.guild.player.songqueue.push(playlistitems[i]["id"])
    msg.guild.player.songtitlequeue.push(playlistitems[i]["title"])
  }
}

async function generateQueueText(page,queue,current){
  let queuestring = "" 
        for (i = page*10-10; i < Math.min((queue.length),page*10); i++) {
          if (i == current) {
            queuestring = queuestring + "**"
          }
          queuestring = queuestring + (i + 1) + ". " + queue[i]
          if (i == current) {
            queuestring = queuestring + "**"
          }
          queuestring = queuestring + "\n"
        }
  queuestring+="Page: "+page.toString()
  return queuestring
}



/*function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {logit("receiving chunk"); chunks.push(Buffer.from(chunk))});
    stream.on('error', (err) => reject(err));
    stream.on('end', () => {logit("resovled"); resolve(Buffer.concat(chunks))});
  })
}*/
client.login(token).catch(logit);
