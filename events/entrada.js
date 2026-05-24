const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {

    // ID do canal de entrada
    const canalID = "1500216201031450672";

    // ID do cargo automático
    const cargoID = "1500216200485928961";

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
