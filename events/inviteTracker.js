const invites = new Map();

module.exports = async (client) => {

  // Carrega invites ao iniciar
  client.guilds.cache.forEach(async (guild) => {
    const guildInvites = await guild.invites.fetch();
    invites.set(guild.id, guildInvites);
  });

  // Quando alguém entra
  client.on("guildMemberAdd", async (member) => {

    const oldInvites = invites.get(member.guild.id);

    const newInvites = await member.guild.invites.fetch();

    invites.set(member.guild.id, newInvites);

    const usedInvite = newInvites.find(inv =>
      oldInvites.get(inv.code)?.uses < inv.uses
    );

    const canal = member.guild.channels.cache.get("ID_DO_CANAL");

    if (!usedInvite) {
      return canal.send(
        `📥 ${member.user.tag} entrou no servidor.`
      );
    }

    const inviter = usedInvite.inviter;

    canal.send(
      `🎉 ${member.user.tag} entrou através do convite de ${inviter.tag}\n📨 Código: ${usedInvite.code}\n🔥 Uses: ${usedInvite.uses}`
    );

  });

};
