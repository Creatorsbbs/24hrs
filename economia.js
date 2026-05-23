module.exports = (client) => {

const {
  EmbedBuilder
} = require("discord.js");

  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  
const Database = require("better-sqlite3");

// ======================================================
//                     CONFIGURAÇÃO
// ======================================================

const PREFIX = "!";

// ======================================================
//                    BANCO SQLITE
// ======================================================

const db = new Database("./economy.sqlite");

// ======================================================
//                    TABELA USERS
// ======================================================

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  wallet INTEGER DEFAULT 0,
  bank INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  daily INTEGER DEFAULT 0,
  work INTEGER DEFAULT 0,
  energy INTEGER DEFAULT 100
)
`).run();

// ======================================================
//                    TABELA INVENTORY
// ======================================================

db.prepare(`
CREATE TABLE IF NOT EXISTS inventory (
  userId TEXT,
  item TEXT,
  quantity INTEGER
)
`).run();

// ======================================================
//                    TABELA SHOP
// ======================================================

db.prepare(`
CREATE TABLE IF NOT EXISTS shop (
  item TEXT,
  price INTEGER,
  emoji TEXT,
  rarity TEXT
)
`).run();

// ======================================================
//                    ITENS DA LOJA
// ======================================================

const items = [
  {
    item: "Pizza",
    price: 100,
    emoji: "🍕",
    rarity: "Comum"
  },
  {
    item: "Notebook",
    price: 5000,
    emoji: "💻",
    rarity: "Raro"
  },
  {
    item: "Celular",
    price: 3000,
    emoji: "📱",
    rarity: "Incomum"
  },
  {
    item: "Carro",
    price: 20000,
    emoji: "🚗",
    rarity: "Lendário"
  },
  {
    item: "Capivara",
    price: 100000,
    emoji: "🦫",
    rarity: "Mítico"
  }
];

for (const item of items) {

  const exists = db.prepare(
    "SELECT * FROM shop WHERE item = ?"
  ).get(item.item);

  if (!exists) {

    db.prepare(`
      INSERT INTO shop
      (item, price, emoji, rarity)
      VALUES (?, ?, ?, ?)
    `).run(
      item.item,
      item.price,
      item.emoji,
      item.rarity
    );

  }

}

// ======================================================
//                FUNÇÃO CRIAR USER
// ======================================================

function createUser(userId) {

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(userId);

  if (!user) {

    db.prepare(`
      INSERT INTO users (userId)
      VALUES (?)
    `).run(userId);

  }

}

// ======================================================
//                  SISTEMA LEVEL
// ======================================================

function checkLevelUp(userId) {

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(userId);

  const needXp = user.level * 100;

  if (user.xp >= needXp) {

    db.prepare(`
      UPDATE users
      SET level = level + 1,
          xp = 0
      WHERE userId = ?
    `).run(userId);

    return true;
  }

  return false;

}

  /* ======================================================
   🖼️ SISTEMA DE PERFIL EM IMAGEM (ESTILO ZANY)
   👉 Essa função cria a imagem do comando !perfil
====================================================== */

async function createProfileImage(user, data) {
  const canvas = createCanvas(900, 300);
  const ctx = canvas.getContext("2d");

  // 🎨 FUNDO GRADIENTE
  const gradient = ctx.createLinearGradient(0, 0, 900, 300);
  gradient.addColorStop(0, "#0b0f1a");
  gradient.addColorStop(1, "#1a1f2e");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 300);

  // 🧊 CARD CENTRAL
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(20, 20, 860, 260);

  // 🧠 NOME
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  ctx.fillText(user.username, 180, 90);

  // 💰 INFO
  ctx.font = "28px Arial";
  ctx.fillStyle = "#00ff88";
  ctx.fillText(`💰 ${data.wallet}`, 180, 150);

  ctx.fillStyle = "#00b7ff";
  ctx.fillText(`🏦 ${data.bank}`, 180, 190);

  ctx.fillStyle = "#ffd700";
  ctx.fillText(`⭐ Level ${data.level}`, 180, 230);

  // 🖼️ AVATAR
  const avatar = await loadImage(
    user.displayAvatarURL({ extension: "png", size: 256 })
  );

  // círculo com borda
  ctx.save();

  ctx.beginPath();
  ctx.arc(100, 150, 70, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(avatar, 30, 80, 140, 140);

  ctx.restore();

  // 🔵 BORDA DO AVATAR
  ctx.beginPath();
  ctx.arc(100, 150, 72, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 4;
  ctx.stroke();

  return canvas.toBuffer("image/png");
}

// ======================================================
//                SISTEMA DE COMANDOS
// ======================================================

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/ +/);

  const command = args.shift().toLowerCase();

  createUser(message.author.id);

// ======================================================
//                    COMANDO PERFIL
// ======================================================

if (command === "perfil") {

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  const img = await createProfileImage(message.author, user);

  return message.reply({
    files: [{
      attachment: img,
      name: "perfil.png"
    }]
  });

}

// ======================================================
//                    COMANDO DAILY
// ======================================================

if (command === "daily") {

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  const timeout = 24 * 60 * 60 * 1000;

  if (Date.now() < user.daily + timeout) {

    const timeLeft = Math.floor(
      (user.daily + timeout - Date.now()) / 1000
    );

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("⏰ Daily indisponível")
      .setDescription(
`Você já coletou seu prêmio diário.

🕒 Volte em **${timeLeft} segundos**`
      );

    return message.reply({
      embeds: [embed]
    });

  }

  const reward = 5000;

  db.prepare(`
    UPDATE users
    SET wallet = wallet + ?,
        xp = xp + 30,
        daily = ?
    WHERE userId = ?
  `).run(
    reward,
    Date.now(),
    message.author.id
  );

  checkLevelUp(message.author.id);

  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("🎁 Daily coletado")
    .setThumbnail(message.author.displayAvatarURL())
    .setDescription(
`💸 Você recebeu **${reward} moedas**
⚡ Você ganhou **30 XP**`
    )
    .setFooter({
      text: "Volte amanhã para pegar novamente"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                    COMANDO WORK
// ======================================================

if (command === "work") {

  const jobs = [
    "Programador 💻",
    "Streamer 🎥",
    "Policial 🚔",
    "Pescador 🎣",
    "Motorista 🚗",
    "Minerador ⛏️"
  ];

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  const timeout = 60 * 60 * 1000;

  if (Date.now() < user.work + timeout) {

    const timeLeft = Math.floor(
      (user.work + timeout - Date.now()) / 1000
    );

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("⏰ Você está cansado")
      .setDescription(
`Espere **${timeLeft} segundos** para trabalhar novamente.`
      );

    return message.reply({
      embeds: [embed]
    });

  }

  const ganho =
    Math.floor(Math.random() * 5000) + 1000;

  const trabalho =
    jobs[Math.floor(Math.random() * jobs.length)];

  db.prepare(`
    UPDATE users
    SET wallet = wallet + ?,
        xp = xp + 50,
        energy = energy - 10,
        work = ?
    WHERE userId = ?
  `).run(
    ganho,
    Date.now(),
    message.author.id
  );

  const levelUp = checkLevelUp(message.author.id);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("💼 Trabalho concluído")
    .setThumbnail(message.author.displayAvatarURL())
    .setDescription(
`👨‍💻 Trabalho: **${trabalho}**

💰 Ganho: **${ganho} moedas**
⚡ XP recebido: **50 XP**`
    )
    .setFooter({
      text: levelUp ? "🎉 Você subiu de nível!" : "Continue trabalhando"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                    COMANDO SALDO
// ======================================================

if (command === "saldo") {

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  const embed = new EmbedBuilder()
    .setColor("#2bff00")
    .setTitle("💰 Banco Econômico")
    .setThumbnail(message.author.displayAvatarURL())
    .setDescription(
`👛 Carteira: **${user.wallet} moedas**
🏦 Banco: **${user.bank} moedas**`
    )
    .setImage("https://i.imgur.com/AfFp7pu.png")
    .setFooter({
      text: `Solicitado por ${message.author.username}`
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

  // ======================================================
//                COMANDO DEPOSITAR
// ======================================================

if (
  command === "depositar" ||
  command === "dep"
) {

  const value = args[0];

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  let amount;

  // ================= ALL =================

  if (
    value === "all" ||
    value === "tudo"
  ) {

    amount = user.wallet;

  } else {

    amount = Number(value);

  }

  // ================= VALIDAÇÃO =================

  if (!amount || amount <= 0) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("❌ Valor inválido")
          .setDescription(
            "Digite um valor válido para depositar."
          )
      ]
    });

  }

  if (user.wallet < amount) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("❌ Dinheiro insuficiente")
          .setDescription(
            "Você não possui tudo isso na carteira."
          )
      ]
    });

  }

  // ================= UPDATE =================

  db.prepare(`
    UPDATE users
    SET wallet = wallet - ?,
        bank = bank + ?
    WHERE userId = ?
  `).run(
    amount,
    amount,
    message.author.id
  );

  // ================= EMBED =================

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🏦 Depósito realizado")
    .setThumbnail(message.author.displayAvatarURL())
    .setDescription(
`💸 Valor depositado:
**${amount} moedas**

👛 Carteira atual:
**${user.wallet - amount}**

🏦 Banco atual:
**${user.bank + amount}**`
    )
    .setFooter({
      text: `${message.author.username}`
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

  // ======================================================
//                  COMANDO SACAR
// ======================================================

if (command === "sacar") {

  const amount = Number(args[0]);

  if (!amount || amount <= 0) {

    return message.reply("❌ Valor inválido.");

  }

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  if (user.bank < amount) {

    return message.reply(
      "❌ Você não possui isso no banco."
    );

  }

  db.prepare(`
    UPDATE users
    SET bank = bank - ?,
        wallet = wallet + ?
    WHERE userId = ?
  `).run(
    amount,
    amount,
    message.author.id
  );

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("💸 Saque realizado")
    .setDescription(
`🏦 Valor sacado: **${amount} moedas**`
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}
  
// ======================================================
//                    COMANDO PAY
// ======================================================

if (command === "pay") {

  const member =
    message.mentions.users.first();

  const amount = Number(args[1]);

  if (!member) {

    return message.reply("❌ Marque alguém.");

  }

  if (!amount || amount <= 0) {

    return message.reply("❌ Valor inválido.");

  }

  createUser(member.id);

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  if (user.wallet < amount) {

    return message.reply(
      "❌ Dinheiro insuficiente."
    );

  }

  db.prepare(`
    UPDATE users
    SET wallet = wallet - ?
    WHERE userId = ?
  `).run(
    amount,
    message.author.id
  );

  db.prepare(`
    UPDATE users
    SET wallet = wallet + ?
    WHERE userId = ?
  `).run(
    amount,
    member.id
  );

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle("💸 Transferência realizada")
    .setDescription(
`💰 Valor enviado: **${amount} moedas**
👤 Destino: ${member}`
    )
    .setThumbnail(member.displayAvatarURL())
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                    COMANDO LOJA
// ======================================================

if (command === "loja") {

  const loja = db.prepare(
    "SELECT * FROM shop"
  ).all();

  let text = "";

  for (const item of loja) {

    text +=
`${item.emoji} **${item.item}**
💰 ${item.price} moedas
✨ ${item.rarity}

`;

  }

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🛒 Loja Oficial")
    .setDescription(text)
    .setFooter({
      text: "Use !comprar <item>"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                    COMANDO COMPRAR
// ======================================================

if (command === "comprar") {

  const itemName = args.join(" ");

  if (!itemName) {

    return message.reply(
      "❌ Digite o nome do item"
    );

  }

  const item = db.prepare(
    "SELECT * FROM shop WHERE item = ?"
  ).get(itemName);

  if (!item) {

    return message.reply(
      "❌ Item não encontrado"
    );

  }

  const user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(message.author.id);

  if (user.wallet < item.price) {

    return message.reply(
      "❌ Dinheiro insuficiente"
    );

  }

  db.prepare(`
    UPDATE users
    SET wallet = wallet - ?
    WHERE userId = ?
  `).run(
    item.price,
    message.author.id
  );

  const inventoryItem = db.prepare(`
    SELECT * FROM inventory
    WHERE userId = ?
    AND item = ?
  `).get(
    message.author.id,
    item.item
  );

  if (!inventoryItem) {

    db.prepare(`
      INSERT INTO inventory
      (userId, item, quantity)
      VALUES (?, ?, ?)
    `).run(
      message.author.id,
      item.item,
      1
    );

  } else {

    db.prepare(`
      UPDATE inventory
      SET quantity = quantity + 1
      WHERE userId = ?
      AND item = ?
    `).run(
      message.author.id,
      item.item
    );

  }

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("🛍️ Compra realizada")
    .setDescription(
`${item.emoji} Você comprou **${item.item}**

💰 Valor pago: **${item.price} moedas**`
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                  COMANDO INVENTARIO
// ======================================================

if (command === "inventario") {

  const inventory = db.prepare(`
    SELECT * FROM inventory
    WHERE userId = ?
  `).all(message.author.id);

  if (inventory.length <= 0) {

    return message.reply("🎒 Inventário vazio.");

  }

  let text = "";

  for (const item of inventory) {

    text +=
`📦 ${item.item}
🔢 Quantidade: ${item.quantity}

`;

  }

  const embed = new EmbedBuilder()
    .setColor("Orange")
    .setTitle("🎒 Seu Inventário")
    .setDescription(text)
    .setThumbnail(message.author.displayAvatarURL())
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

// ======================================================
//                    COMANDO RANK
// ======================================================

if (command === "rank") {

  const top = db.prepare(`
    SELECT *
    FROM users
    ORDER BY wallet + bank DESC
    LIMIT 10
  `).all();

  let text = "";

  for (let i = 0; i < top.length; i++) {

    const user =
      await client.users.fetch(top[i].userId);

    text +=
`👑 ${i + 1}° ${user.username}
💰 ${top[i].wallet + top[i].bank} moedas

`;

  }

  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("🏆 Ranking Global")
    .setDescription(text)
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });

}

});

};
