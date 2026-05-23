const {
  PermissionsBitField
} = require("discord.js");

module.exports = async (interaction) => {

  // ================= /LIMPAR =================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "limpar"
  ) {

    // ================= PERMISSÃO =================

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {

      return interaction.reply({
        content: "❌ Você não possui permissão.",
        ephemeral: true
      });
    }

    // ================= QUANTIDADE =================

    const quantidade =
      interaction.options.getInteger("quantidade");

    if (
      quantidade < 1 ||
      quantidade > 100
    ) {

      return interaction.reply({
        content:
          "❌ Escolha entre 1 e 100 mensagens.",
        ephemeral: true
      });
    }

    try {

      // ================= APAGAR =================

      await interaction.channel.bulkDelete(
        quantidade,
        true
      );

      // ================= RESPOSTA =================

      const msg =
        await interaction.reply({
          content:
            `🧹 ${quantidade} mensagens apagadas.`,
          ephemeral: true
        });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 3000);

    } catch (err) {

      console.log(err);

      return interaction.reply({
        content:
          "❌ Erro ao limpar mensagens.",
        ephemeral: true
      });
    }
  }
};
