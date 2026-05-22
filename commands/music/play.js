const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");

const play = require("play-dl");

const player = createAudioPlayer();

module.exports = {

  name: "play",

  async execute(message, args) {

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply("❌ Entre em uma call.");
    }

    const query = args.join(" ");

    if (!query) {
      return message.reply("❌ Digite uma música.");
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    const search = await play.search(query, { limit: 1 });

    if (!search.length) {
      return message.reply("❌ Música não encontrada.");
    }

    const stream = await play.stream(search[0].url);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    player.play(resource);

    connection.subscribe(player);

    message.reply(`🎶 Tocando: ${search[0].title}`);
  }
};
