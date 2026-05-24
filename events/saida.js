const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {

    // ID do canal de saída
    const canalID = "1500216201031450673";

    const canal = member.guild.channels.cache.get(canalID);

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("😢 Membro saiu")
      .setDescription(
        `🚪 ${member.user.tag} saiu do servidor...\n\n` +
        `Esperamos te ver novamente algum dia 💔`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))

      // Banner/imagem grande
      .setImage("https://cdn.discordapp.com/attachments/1500914111725436992/1507923935516168232/file_00000000ab5071f9b33b3d5a761a07e3.png?ex=6a13ab1a&is=6a12599a&hm=834ce535cbd7c944e53c785597f1481ec34ba7f23198f1c5405947b732c89607&")

      .setFooter({
        text: `Agora temos ${member.guild.memberCount} membros`
      })

      .setTimestamp();

    if (canal) {
      canal.send({ embeds: [embed] });
    }
  }
};
