const {
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

// ================= CONFIG =================
const CATEGORY = "📊・AUDITORIA DO SERVIDOR";

const CHANNELS = {
  join: "👋・entradas-saidas",
  messages: "🗑️・mensagens",
  edits: "✏️・edições",
  roles: "🎭・cargos",
  mod: "🔨・moderação",
  channels: "📁・canais"
};

// ================= CACHE =================
const cache = new Map();
const messageBackup = new Map();

// ================= SAFE =================
const safe = (t) => (t ? String(t).slice(0, 1024) : "—");

// ================= CATEGORY =================
async function getCategory(guild) {
  let cat = guild.channels.cache.find(
    c => c.name === CATEGORY && c.type === ChannelType.GuildCategory
  );

  if (!cat) {
    cat = await guild.channels.create({
      name: CATEGORY,
      type: ChannelType.GuildCategory
    });
  }

  return cat;
}

// ================= CHANNEL =================
async function getChannel(guild, name, cat) {
  const key = `${guild.id}-${name}`;
  if (cache.has(key)) return cache.get(key);

  let ch = guild.channels.cache.find(
    c => c.name === name && c.type === ChannelType.GuildText
  );

  if (!ch) {
    ch = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: cat.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.SendMessages]
        }
      ]
    });
  }

  cache.set(key, ch);
  return ch;
}

// ================= EMBED BASE =================
function baseEmbed(title, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp();
}

// ================= MAIN =================
module.exports = (client) => {

  // ================= BACKUP =================
  client.on("messageCreate", (msg) => {
    if (!msg.guild || msg.author.bot) return;

    messageBackup.set(msg.id, {
      content: msg.content,
      author: msg.author.tag,
      channel: msg.channel.id
    });
  });

  // ================= DELETE =================
  client.on("messageDelete", async (msg) => {
    if (!msg.guild) return;

    const backup = messageBackup.get(msg.id);

    const cat = await getCategory(msg.guild);
    const ch = await getChannel(msg.guild, CHANNELS.messages, cat);

    const embed = baseEmbed("🗑️ Mensagem apagada", "Red")
      .addFields(
        { name: "Autor", value: backup?.author || msg.author?.tag || "unknown" },
        { name: "Canal", value: `<#${msg.channel.id}>` },
        { name: "Conteúdo", value: safe(backup?.content || msg.content) }
      );

    ch.send({ embeds: [embed] }).catch(() => {});
    messageBackup.delete(msg.id);
  });

  // ================= EDIT =================
  client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (!oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const cat = await getCategory(oldMsg.guild);
    const ch = await getChannel(oldMsg.guild, CHANNELS.edits, cat);

    ch.send({
      embeds: [
        baseEmbed("✏️ Mensagem editada", "Yellow")
          .addFields(
            { name: "Autor", value: oldMsg.author.tag },
            { name: "Antes", value: safe(oldMsg.content) },
            { name: "Depois", value: safe(newMsg.content) }
          )
      ]
    }).catch(() => {});
  });

  // ================= KICK / LEAVE =================
  client.on("guildMemberRemove", async (member) => {
    const guild = member.guild;
    const cat = await getCategory(guild);
    const ch = await getChannel(guild, CHANNELS.mod, cat);

    let executor = null;

    try {
      const logs = await guild.fetchAuditLogs({ limit: 1, type: 20 });
      const entry = logs.entries.first();

      if (entry?.target?.id === member.id) {
        executor = entry.executor;
      }
    } catch {}

    if (executor) {
      return ch.send({
        embeds: [
          baseEmbed("👢 Kick detectado", "Orange")
            .addFields(
              { name: "Usuário", value: member.user.tag },
              { name: "Mod", value: executor.tag }
            )
        ]
      }).catch(() => {});
    }

    const joinCh = await getChannel(guild, CHANNELS.join, cat);

    joinCh.send({
      embeds: [
        baseEmbed("📤 Saída", "Red")
          .setDescription(member.user.tag)
      ]
    }).catch(() => {});
  });

  // ================= BAN =================
  client.on("guildBanAdd", async (ban) => {
    const cat = await getCategory(ban.guild);
    const ch = await getChannel(ban.guild, CHANNELS.mod, cat);

    ch.send({
      embeds: [
        baseEmbed("🔨 Banimento", "DarkRed")
          .addFields(
            { name: "Usuário", value: ban.user.tag }
          )
      ]
    }).catch(() => {});
  });

  // ================= UNBAN =================
  client.on("guildBanRemove", async (ban) => {
    const cat = await getCategory(ban.guild);
    const ch = await getChannel(ban.guild, CHANNELS.mod, cat);

    ch.send({
      embeds: [
        baseEmbed("🔓 Unban", "Green")
          .addFields(
            { name: "Usuário", value: ban.user.tag }
          )
      ]
    }).catch(() => {});
  });

  // ================= ROLES =================
  client.on("guildMemberUpdate", async (oldM, newM) => {
    const cat = await getCategory(newM.guild);
    const ch = await getChannel(newM.guild, CHANNELS.roles, cat);

    const oldRoles = oldM.roles.cache.map(r => r.id);
    const newRoles = newM.roles.cache.map(r => r.id);

    const added = newRoles.filter(r => !oldRoles.includes(r));
    const removed = oldRoles.filter(r => !newRoles.includes(r));

    if (!added.length && !removed.length) return;

    ch.send({
      embeds: [
        baseEmbed("🎭 Cargos atualizados", "Blue")
          .addFields(
            { name: "Usuário", value: newM.user.tag },
            { name: "Adicionados", value: added.length ? added.map(r => `<@&${r}>`).join(", ") : "—" },
            { name: "Removidos", value: removed.length ? removed.map(r => `<@&${r}>`).join(", ") : "—" }
          )
      ]
    }).catch(() => {});
  });

  // ================= CHANNELS =================
  client.on("channelCreate", async (chData) => {
    if (!chData.guild) return;

    const cat = await getCategory(chData.guild);
    const ch = await getChannel(chData.guild, CHANNELS.channels, cat);

    ch.send({
      embeds: [
        baseEmbed("📁 Canal criado", "Green")
          .setDescription(chData.name)
      ]
    }).catch(() => {});
  });

  client.on("channelDelete", async (chData) => {
    if (!chData.guild) return;

    const cat = await getCategory(chData.guild);
    const ch = await getChannel(chData.guild, CHANNELS.channels, cat);

    ch.send({
      embeds: [
        baseEmbed("🧨 Canal deletado", "Red")
          .setDescription(chData.name)
      ]
    }).catch(() => {});
  });

  console.log("📊 ULTRA LOG SYSTEM ATIVADO");
};
