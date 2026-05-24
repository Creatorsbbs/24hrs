const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberRemove",

  async execute(member) {

    // ID do canal de saída
    const canalID = "ID_DO_CANAL";

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
      .setImage("LINK_DA_IMAGEM_AQUI")

      .setFooter({
        text: `Agora temos ${member.guild.memberCount} membros`
      })

      .setTimestamp();

    if (canal) {
      canal.send({ embeds: [embed] });
    }
  }
};
