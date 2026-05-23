const { REST, Routes, SlashCommandBuilder } = require("discord.js");

module.exports = async (client) => {

  const commands = [
    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Abre o painel de tickets"),

    new SlashCommandBuilder()
      .setName("forca")
      .setDescription("Inicia forca multiplayer"),

    new SlashCommandBuilder()
      .setName("setstaff")
      .setDescription("Define staff"),

    new SlashCommandBuilder()
      .setName("skin")
      .setDescription("Mostra a skin de um jogador Roblox")
      .addStringOption(option =>
        option
          .setName("usuario")
          .setDescription("Nome do jogador Roblox")
          .setRequired(true)
      ),

    // ================= PONTO =================

    new SlashCommandBuilder()
      .setName("ponto")
      .setDescription("Inicia o ponto"),

    new SlashCommandBuilder()
      .setName("ranking")
      .setDescription("Mostra ranking de horas"),

    new SlashCommandBuilder()
      .setName("meuponto")
      .setDescription("Mostra suas horas"),

    // ================= LIMPAR PONTOS =================

    new SlashCommandBuilder()
      .setName("limparpontos")
      .setDescription("Limpa registros de ponto")
      .addStringOption(option =>
        option
          .setName("periodo")
          .setDescription("Escolha o período")
          .setRequired(true)
          .addChoices(
            {
              name: "Dia",
              value: "dia"
            },
            {
              name: "Semana",
              value: "semana"
            },
            {
              name: "Mês",
              value: "mes"
            },
            {
              name: "Tudo",
              value: "tudo"
            }
          )
      )
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuário específico")
          .setRequired(false)
      ),

    // ================= LIMPAR =================

new SlashCommandBuilder()
  .setName("limpar")
  .setDescription("Limpa mensagens do canal")
  .addIntegerOption(option =>
    option
      .setName("quantidade")
      .setDescription("Quantidade de mensagens")
      .setRequired(true)
  )
  
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Comandos registrados");
  } catch (err) {
    console.log("❌ erro:", err);
  }
};
