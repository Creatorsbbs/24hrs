// ================= SISTEMA PROFISSIONAL DE BATE-PONTO =================
// 📁 systems/pontoSystem.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { QuickDB } = require("quick.db");

const db = new QuickDB();

// ================= FORMATADOR =================

function formatDuration(ms) {

  const segundos = Math.floor(ms / 1000) % 60;
  const minutos = Math.floor(ms / 60000) % 60;
  const horas = Math.floor(ms / 3600000);

  return `${horas}h ${minutos}m ${segundos}s`;
}

function discordTime(ms) {
  return `<t:${Math.floor(ms / 1000)}:F>`;
}

// ================= EMBED ATIVA =================

function createLiveEmbed(user, data) {

  let total = Date.now() - data.start;

  total -= data.pauseTotal || 0;

  if (data.pausado) {
    total -= (Date.now() - data.pauseStart);
  }

  const status = data.pausado
    ? "⏸️ Pausado"
    : "🟢 Em Serviço";

  return new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle("⏳ • Sistema de Bate-Ponto")
    .setDescription(`
### 👤 Usuário
${user}

### 📅 Início
${discordTime(data.start)}

### 📊 Status
${status}

### ⏰ Tempo Atual
\`${formatDuration(total)}\`

### ⚡ Sistema automático ativo
`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({
      text: "Sistema profissional de ponto"
    })
    .setTimestamp();
}

// ================= EMBED FINAL =================

function createFinalEmbed(user, data, total) {

  return new EmbedBuilder()
    .setColor("#111214")
    .setTitle("📁 • Registro Finalizado")
    .setDescription(`
Use /reabrir para abrir este ponto novamente.

### 👤 Usuário
${user}

### 📅 Início
${discordTime(data.start)}

### 🛑 Término
${discordTime(Date.now())}

### ⏰ Tempo Total
\`${formatDuration(total)}\`

### ✅ Ponto encerrado com sucesso
`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({
      text: "Sistema profissional de ponto"
    })
    .setTimestamp();
}

// ================= BOTÕES =================

function createButtons(pausado = false) {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("ponto_pause")
        .setLabel("Pausar")
        .setEmoji("⏸️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pausado),

      new ButtonBuilder()
        .setCustomId("ponto_resume")
        .setLabel("Retomar")
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!pausado),

      new ButtonBuilder()
        .setCustomId("ponto_stop")
        .setLabel("Encerrar")
        .setEmoji("🛑")
        .setStyle(ButtonStyle.Danger)
    );
}

// ================= EXPORT =================

module.exports = async (client, interaction) => {

  // =====================================================
  // /PONTO
  // =====================================================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "ponto"
  ) {

    const active =
      await db.get(`ponto_${interaction.user.id}`);

    if (active) {

      return interaction.reply({
        content: "❌ Você já possui um ponto aberto.",
        ephemeral: true
      });
    }

    const data = {
      start: Date.now(),
      pausado: false,
      pauseTotal: 0,
      pauseStart: null
    };

    await db.set(
      `ponto_${interaction.user.id}`,
      data
    );

    const embed =
      createLiveEmbed(interaction.user, data);

    const row =
      createButtons(false);

    const msg =
      await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

    await db.set(
      `ponto_msg_${interaction.user.id}`,
      {
        channelId: msg.channel.id,
        messageId: msg.id
      }
    );

    // ================= AUTO UPDATE =================

    const interval = setInterval(async () => {

      const latest =
        await db.get(`ponto_${interaction.user.id}`);

      if (!latest) {
        clearInterval(interval);
        return;
      }

      try {

        const channel =
          await client.channels.fetch(msg.channel.id);

        const message =
          await channel.messages.fetch(msg.id);

        await message.edit({
          embeds: [
            createLiveEmbed(
              interaction.user,
              latest
            )
          ],
          components: [
            createButtons(latest.pausado)
          ]
        });

      } catch {
        clearInterval(interval);
      }

    }, 5000);
  }

  // =====================================================
  // /MEUPONTO
  // =====================================================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "meuponto"
  ) {

    const total =
      await db.get(`total_${interaction.user.id}`) || 0;

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("📊 • Seu Ranking")
      .setDescription(`
### 👤 Usuário
${interaction.user}

### ⏰ Tempo Total
\`${formatDuration(total)}\`
`)
      .setThumbnail(
        interaction.user.displayAvatarURL()
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }

  // =====================================================
  // /RANKING
  // =====================================================

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "ranking"
  ) {

    const all = await db.all();

    const ranking = all
      .filter(d =>
        d.id.startsWith("total_")
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

      desc +=
        `**${i + 1}.** ${user} — \`${formatDuration(ranking[i].value)}\`\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("🏆 • Ranking de Horas")
      .setDescription(
        desc || "Sem dados."
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }

  // =====================================================
  // BOTÕES
  // =====================================================

  if (!interaction.isButton()) return;

  if (
    ![
      "ponto_pause",
      "ponto_resume",
      "ponto_stop"
    ].includes(interaction.customId)
  ) return;

  const data =
    await db.get(`ponto_${interaction.user.id}`);

  if (!data) {

    return interaction.reply({
      content: "❌ Você não possui ponto ativo.",
      ephemeral: true
    });
  }

  // ================= PAUSE =================

  if (interaction.customId === "ponto_pause") {

    if (data.pausado) {

      return interaction.reply({
        content: "❌ Seu ponto já está pausado.",
        ephemeral: true
      });
    }

    data.pausado = true;
    data.pauseStart = Date.now();

    await db.set(
      `ponto_${interaction.user.id}`,
      data
    );

    return interaction.update({
      embeds: [
        createLiveEmbed(
          interaction.user,
          data
        )
      ],
      components: [
        createButtons(true)
      ]
    });
  }

  // ================= RESUME =================

  if (interaction.customId === "ponto_resume") {

    if (!data.pausado) {

      return interaction.reply({
        content: "❌ Seu ponto não está pausado.",
        ephemeral: true
      });
    }

    const pausedTime =
      Date.now() - data.pauseStart;

    data.pauseTotal += pausedTime;

    data.pausado = false;
    data.pauseStart = null;

    await db.set(
      `ponto_${interaction.user.id}`,
      data
    );

    return interaction.update({
      embeds: [
        createLiveEmbed(
          interaction.user,
          data
        )
      ],
      components: [
        createButtons(false)
      ]
    });
  }

  // ================= STOP =================

  if (interaction.customId === "ponto_stop") {

    let total =
      Date.now() - data.start;

    total -= data.pauseTotal;

    if (data.pausado) {
      total -= (Date.now() - data.pauseStart);
    }

    await db.add(
      `total_${interaction.user.id}`,
      total
    );

    await db.delete(
      `ponto_${interaction.user.id}`
    );

    return interaction.update({
      embeds: [
        createFinalEmbed(
          interaction.user,
          data,
          total
        )
      ],
      components: []
    });
  }
};
