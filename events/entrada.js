const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {

    // ID do canal de entrada
    const canalID = "ID_DO_CANAL";

    // ID do cargo automático
    const cargoID = "ID_DO_CARGO";

    const canal = member.guild.channels.cache.get(canalID);

    // Adiciona cargo automático
    const cargo = member.guild.roles.cache.get(cargoID);

    if (cargo) {
      member.roles.add(cargo).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff88")
      .setTitle("🎉 Novo membro entrou!")
      .setDescription(
        `👋 Olá ${member}\n\n` +
        `Seja bem-vindo ao servidor **${member.guild.name}**!\n` +
        `Aproveite, leia as regras e divirta-se 🚀`
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
