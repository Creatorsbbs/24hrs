const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { QuickDB } = require("quick.db");

const db = new QuickDB();

module.exports = async (client, interaction) => {

  // ================= /PONTO =================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "ponto"
  ) {

    const ja =
      await db.get(`ponto_${interaction.user.id}`);

    if (ja) {

      return interaction.reply({
        content: "❌ Você já iniciou ponto.",
        ephemeral: true
      });
    }

    await db.set(
      `ponto_${interaction.user.id}`,
      {
        start: Date.now(),
        pausado: false,
        pauseTotal: 0
      }
    );

    const embed = new EmbedBuilder()
      .setTitle("⏰ Sistema de Ponto")
      .setColor("Blue")
      .setDescription(
        "Seu ponto foi iniciado."
      );

    const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId("pause")
          .setLabel("Pausar")
          .setEmoji("⏸️")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("resume")
          .setLabel("Despausar")
          .setEmoji("▶️")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("stop")
          .setLabel("Encerrar")
          .setEmoji("🔴")
          .setStyle(ButtonStyle.Danger)
      );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // ================= /MEUPONTO =================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "meuponto"
  ) {

    const total =
      await db.get(`total_${interaction.user.id}`) || 0;

    const horas =
      Math.floor(total / 3600000);

    const minutos =
      Math.floor((total % 3600000) / 60000);

    return interaction.reply({
      content:
        `⏰ Você possui ${horas}h ${minutos}m`
    });
  }

  // ================= /RANKING =================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "ranking"
  ) {

    const all = await db.all();

    const ranking = all
      .filter(x =>
        x.id.startsWith("total_")
      )
      .sort((a, b) =>
        b.value - a.value
      )
      .slice(0, 10);

    let desc = "";

    for (let i = 0; i < ranking.length; i++) {

      const userId =
        ranking[i].id.replace("total_", "");

      const user =
        await client.users.fetch(userId);

      const horas =
        Math.floor(ranking[i].value / 3600000);

      desc +=
        `**${i + 1}.** ${user.username} - ${horas}h\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking")
      .setDescription(desc)
      .setColor("Gold");

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ================= BOTÕES =================

  if (interaction.isButton()) {

    const data =
      await db.get(`ponto_${interaction.user.id}`);

    if (!data) return;

    // PAUSE
    if (interaction.customId === "pause") {

      if (data.pausado) {

        return interaction.reply({
          content: "❌ Já pausado.",
          ephemeral: true
        });
      }

      data.pausado = true;
      data.pauseStart = Date.now();

      await db.set(
        `ponto_${interaction.user.id}`,
        data
      );

      return interaction.reply({
        content: "⏸️ Ponto pausado.",
        ephemeral: true
      });
    }

    // RESUME
    if (interaction.customId === "resume") {

      if (!data.pausado) {

        return interaction.reply({
          content: "❌ Você não está pausado.",
          ephemeral: true
        });
      }

      const pauseTime =
        Date.now() - data.pauseStart;

      data.pauseTotal += pauseTime;

      data.pausado = false;

      await db.set(
        `ponto_${interaction.user.id}`,
        data
      );

      return interaction.reply({
        content: "▶️ Ponto retomado.",
        ephemeral: true
      });
    }

    // STOP
    if (interaction.customId === "stop") {

      let total =
        Date.now() - data.start;

      total -= data.pauseTotal;

      if (data.pausado) {

        total -=
          (Date.now() - data.pauseStart);
      }

      await db.add(
        `total_${interaction.user.id}`,
        total
      );

      await db.delete(
        `ponto_${interaction.user.id}`
      );

      const horas =
        Math.floor(total / 3600000);

      const minutos =
        Math.floor((total % 3600000) / 60000);

      return interaction.reply({
        content:
          `🔴 Ponto encerrado.\n⏰ ${horas}h ${minutos}m`
      });
    }
  }
};
