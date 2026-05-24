const {
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

// =========================
// CONFIG
// =========================
const CATEGORY_NAME = "📊 LOGS DO SERVIDOR";

const CHANNELS = {
  joinLeave: "👋・entrada-saida",
  messages: "🗑️・mensagens",
  edits: "✏️・edições",
  roles: "🎭・cargos",
  channels: "📁・canais",
  mod: "🔨・moderação",
};

const cache = new Map();

// =========================
// CATEGORY
// =========================
async function getOrCreateCategory(guild) {
  let category = guild.channels.cache.find(
    c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory,
    });
  }

  return category;
}

// =========================
// CHANNELS
// =========================
async function getChannel(guild, name, category) {
  const key = `${guild.id}-${name}`;
  if (cache.has(key)) return cache.get(key);

  let channel = guild.channels.cache.find(
    c => c.name === name && c.type === ChannelType.GuildText
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.SendMessages],
        },
      ],
    });
  }

  cache.set(key, channel);
  return channel;
}

// =========================
// EXPORT
// =========================
module.exports = (client) => {

  // =========================
  // 👋 ENTRADA
  // =========================
  client.on("guildMemberAdd", async (member) => {
    const cat = await getOrCreateCategory(member.guild);
    const ch = await getChannel(member.guild, CHANNELS.joinLeave, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📥 Entrada")
          .setDescription(`${member.user.tag} entrou no servidor`)
          .setColor("Green")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 👋 SAÍDA / KICK DETECT
  // =========================
  client.on("guildMemberRemove", async (member) => {
    const cat = await getOrCreateCategory(member.guild);

    const modChannel = await getChannel(member.guild, CHANNELS.mod, cat);
    const joinLeaveChannel = await getChannel(member.guild, CHANNELS.joinLeave, cat);

    // tenta detectar kick via audit log
    const logs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: 20, // MEMBER_KICK
    }).catch(() => null);

    const kick = logs?.entries.first();

    if (kick && kick.target.id === member.id) {
      return modChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("👢 Kick")
            .addFields(
              { name: "Usuário", value: `${member.user.tag}` },
              { name: "Mod", value: `${kick.executor.tag}` },
              { name: "Motivo", value: kick.reason || "Não informado" }
            )
            .setColor("Orange")
            .setTimestamp()
        ]
      });
    }

    joinLeaveChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📤 Saída")
          .setDescription(`${member.user.tag} saiu do servidor`)
          .setColor("Red")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 🗑️ MENSAGEM APAGADA
  // =========================
  client.on("messageDelete", async (message) => {
    if (!message.guild || message.author?.bot) return;

    const cat = await getOrCreateCategory(message.guild);
    const ch = await getChannel(message.guild, CHANNELS.messages, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗑️ Mensagem apagada")
          .addFields(
            { name: "Autor", value: message.author.tag },
            { name: "Canal", value: `${message.channel}` },
            { name: "Conteúdo", value: message.content || "Sem texto" }
          )
          .setColor("Orange")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // ✏️ MENSAGEM EDITADA
  // =========================
  client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (!oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const cat = await getOrCreateCategory(oldMsg.guild);
    const ch = await getChannel(oldMsg.guild, CHANNELS.edits, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("✏️ Mensagem editada")
          .addFields(
            { name: "Autor", value: oldMsg.author.tag },
            { name: "Antes", value: oldMsg.content || "—" },
            { name: "Depois", value: newMsg.content || "—" }
          )
          .setColor("Yellow")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 🎭 CARGOS
  // =========================
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const cat = await getOrCreateCategory(newMember.guild);
    const ch = await getChannel(newMember.guild, CHANNELS.roles, cat);

    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);

    const added = newRoles.filter(r => !oldRoles.includes(r));
    const removed = oldRoles.filter(r => !newRoles.includes(r));

    if (!added.length && !removed.length) return;

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎭 Cargos atualizados")
          .addFields(
            { name: "Usuário", value: newMember.user.tag },
            { name: "Adicionados", value: added.length ? `<@&${added.join(">, <@&")}>` : "Nenhum" },
            { name: "Removidos", value: removed.length ? `<@&${removed.join(">, <@&")}>` : "Nenhum" }
          )
          .setColor("Blue")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 📁 CANAIS
  // =========================
  client.on("channelCreate", async (channel) => {
    if (!channel.guild) return;

    const cat = await getOrCreateCategory(channel.guild);
    const ch = await getChannel(channel.guild, CHANNELS.channels, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📁 Canal criado")
          .setDescription(channel.name)
          .setColor("Green")
          .setTimestamp()
      ]
    });
  });

  client.on("channelDelete", async (channel) => {
    if (!channel.guild) return;

    const cat = await getOrCreateCategory(channel.guild);
    const ch = await getChannel(channel.guild, CHANNELS.channels, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🧨 Canal deletado")
          .setDescription(channel.name)
          .setColor("Red")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 🔨 MODERAÇÃO - BAN
  // =========================
  client.on("guildBanAdd", async (ban) => {
    const cat = await getOrCreateCategory(ban.guild);
    const ch = await getChannel(ban.guild, CHANNELS.mod, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔨 Banimento")
          .addFields(
            { name: "Usuário", value: `${ban.user.tag}` },
            { name: "ID", value: ban.user.id }
          )
          .setColor("DarkRed")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 🔓 UNBAN
  // =========================
  client.on("guildBanRemove", async (ban) => {
    const cat = await getOrCreateCategory(ban.guild);
    const ch = await getChannel(ban.guild, CHANNELS.mod, cat);

    ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔓 Desbanido")
          .addFields(
            { name: "Usuário", value: `${ban.user.tag}` },
            { name: "ID", value: ban.user.id }
          )
          .setColor("Green")
          .setTimestamp()
      ]
    });
  });

  // =========================
  // 🔇 MUTE / TIMEOUT
  // =========================
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const cat = await getOrCreateCategory(newMember.guild);
    const ch = await getChannel(newMember.guild, CHANNELS.mod, cat);

    const oldMute = oldMember.communicationDisabledUntilTimestamp;
    const newMute = newMember.communicationDisabledUntilTimestamp;

    // mute aplicado
    if (!oldMute && newMute) {
      return ch.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔇 Mute aplicado")
            .addFields(
              { name: "Usuário", value: `${newMember.user.tag}` },
              { name: "Até", value: `<t:${Math.floor(newMute / 1000)}:F>` }
            )
            .setColor("Yellow")
            .setTimestamp()
        ]
      });
    }

    // mute removido
    if (oldMute && !newMute) {
      return ch.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔊 Mute removido")
            .addFields(
              { name: "Usuário", value: `${newMember.user.tag}` }
            )
            .setColor("Green")
            .setTimestamp()
        ]
      });
    }
  });

};
