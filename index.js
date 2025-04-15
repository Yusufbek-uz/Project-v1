const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv");
const askAI = require("./ai");
const fs = require("fs");

dotenv.config();

const bot = new Telegraf(process.env.TG_TOKEN);
let chatMode = false;

// Admin Telegram ID
const ADMIN_ID = 1299118140; // ← Replace with your Telegram ID

// Start command - saves user + sends optimized image
bot.start((ctx) => {
  // Save user data
  const user = {
    id: ctx.from.id,
    username: ctx.from.username || "",
    first_name: ctx.from.first_name || "",
    date: new Date().toISOString(),
  };

  // Initialize users.json if not exists
  if (!fs.existsSync("users.json")) {
    fs.writeFileSync("users.json", "[]");
  }

  let users = JSON.parse(fs.readFileSync("users.json", "utf8"));

  // Add user if not exists
  const exists = users.some((u) => u.id === user.id);
  if (!exists) {
    users.push(user);
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  }

  // Send optimized welcome message
  return ctx.replyWithPhoto(
    { 
      source: fs.createReadStream("Veranix.jpg"),
      filename: 'welcome.jpg'
    },
    {
      caption: `👋 *Salom ${ctx.from.first_name || 'foydalanuvchi'}!*\n` +
               `🤖 *AI Assistant* botiga xush kelibsiz!\n\n` +
               `Men sizga har qanday savollarga javob bera olaman. Quyidagi tugmalardan foydalaning:`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "ℹ️ Bot haqida", callback_data: "about_bot" },
            { text: "⚙️ Sozlamalar", callback_data: "settings" }
          ],
          [
            { text: "🌐 Mening kanalim", url: "https://t.me/veranix1" },
            { text: "📊 Statistika", callback_data: "stats" }
          ],
          [
            { text: "💬 AI Chatni boshlash", callback_data: "start_chat" }
          ]
        ],
      },
    }
  );
});

// Chat mode commands
bot.command("on", (ctx) => {
  chatMode = true;
  ctx.replyWithMarkdown(
    "✅ *AI Chat rejimi yoqildi!*\n" +
    "Endi siz menga istalgan savollaringizni berishingiz mumkin."
  );
});

bot.command("off", (ctx) => {
  chatMode = false;
  ctx.replyWithMarkdown(
    "⛔ *AI Chat rejimi o'chirildi.*\n" +
    "Yana chatni boshlash uchun /on buyrug'ini yuboring."
  );
});

// Model info command
bot.command("model", (ctx) => {
  ctx.replyWithMarkdown(
    "🧠 *Joriy model:* `deepseek-ai/DeepSeek-R1`\n" +
    "⚡ *Tezlik:* Yuqori\n" +
    "📅 *Yangilangan:* 2024-yil\n\n" +
    "Model haqida ko'proq ma'lumot: [DeepSeek AI](https://deepseek.com)"
  );
});

// About command
bot.command("about", (ctx) => {
  ctx.replyWithMarkdown(
    "🤖 *AI Assistant Bot*\n\n" +
    "🔹 *Versiya:* 2.0\n" +
    "🔹 *Ishlab chiqaruvchi:* [Veranix](https://t.me/veranix_chat)\n" +
    "🔹 *Texnologiya:* IO.NET AI platformasi\n\n" +
    "Bu bot sizga har qanday mavzuda yordam bera oladi!"
  );
});

// Admin command: users list
bot.command("users", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.replyWithMarkdown("❌ *Ruxsat etilmagan!*");
  }

  let users = [];
  if (fs.existsSync("users.json")) {
    users = JSON.parse(fs.readFileSync("users.json", "utf8"));
  }

  if (users.length === 0) {
    return ctx.reply("👥 Hozircha foydalanuvchilar mavjud emas.");
  }

  const list = users
    .map((u, i) => 
      `${i + 1}. 👤 *${u.first_name}* (@${u.username || "noma'lum"}) \n   🆔 ${u.id}\n   📅 ${new Date(u.date).toLocaleDateString()}`
    )
    .join("\n\n");

  ctx.replyWithMarkdown(
    `📊 *Foydalanuvchilar ro'yxati* (${users.length} ta):\n\n${list}`
  );
});

// Text message handling
bot.on("text", async (ctx) => {
  if (!chatMode) {
    return ctx.replyWithMarkdown(
      "🔇 *AI Chat hozircha o'chirilgan holatda.*\n\n" +
      "Chatni yoqish uchun quyidagi tugmalardan foydalaning:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Chatni yoqish", "turn_on"),
          Markup.button.callback("ℹ️ Yordam", "about_bot")
        ]
      ])
    );
  }

  try {
    const userText = ctx.message.text;
    // Show typing action
    await ctx.replyWithChatAction('typing');
    
    const reply = await askAI(userText);
    
    // Format the response nicely
    ctx.replyWithMarkdown(`💡 *Javob:*\n\n${reply}`);
  } catch (error) {
    console.error("AI error:", error);
    ctx.replyWithMarkdown(
      "❌ *Xatolik yuz berdi!*\n" +
      "Iltimos, keyinroq qayta urinib ko'ring yoki /off buyrug'i bilan chatni o'chirib, keyin /on bilan qayta yoqing."
    );
  }
});

// Callback handlers
bot.action("about_bot", (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    "🤖 *AI Assistant Bot haqida*\n\n" +
    "Bu bot sizga:\n" +
    "🔹 Umumiy bilimlar\n" +
    "🔹 Dasturlash masalalari\n" +
    "🔹 Tarjima xizmati\n" +
    "🔹 Va boshqa ko'plab sohalarda yordam bera oladi!\n\n" +
    "Chat rejimini yoqish uchun /on buyrug'ini yuboring."
  );
});

bot.action("settings", (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    "⚙️ *Sozlamalar*\n\n" +
    "🔹 *Chat holati:* " + (chatMode ? "✅ Yoqilgan" : "❌ O'chirilgan") + "\n" +
    "🔹 *Model:* DeepSeek-R1\n\n" +
    "Chat holatini o'zgartirish:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(chatMode ? "⛔ O'chirish" : "✅ Yoqish", 
                              chatMode ? "turn_off" : "turn_on")
      ],
      [
        Markup.button.callback("🔙 Orqaga", "back_to_main")
      ]
    ])
  );
});

bot.action("stats", (ctx) => {
  ctx.answerCbQuery();
  
  let users = [];
  if (fs.existsSync("users.json")) {
    users = JSON.parse(fs.readFileSync("users.json", "utf8"));
  }
  
  ctx.replyWithMarkdown(
    "📊 *Bot statistikasi*\n\n" +
    `👥 *Foydalanuvchilar:* ${users.length} ta\n` +
    `💬 *Chat holati:* ${chatMode ? "Faol" : "Nofaol"}\n` +
    `🔄 *Oxirgi yangilanish:* ${new Date().toLocaleDateString()}`
  );
});

bot.action("start_chat", (ctx) => {
  chatMode = true;
  ctx.answerCbQuery("💬 Chat rejimi yoqildi!");
  ctx.replyWithMarkdown(
    "💬 *AI Chat rejimi yoqildi!*\n\n" +
    "Endi siz menga istalgan savollaringizni berishingiz mumkin. " +
    "Misol uchun:\n\n" +
    "• _JavaScript nima?_ \n" +
    "• _Toshkentdan Samarqandgacha masofa qancha?_ \n" +
    "• _Fotosintez jarayoni qanday bo'ladi?_"
  );
});

bot.action("turn_on", (ctx) => {
  chatMode = true;
  ctx.answerCbQuery("✅ Chat yoqildi!");
  ctx.replyWithMarkdown(
    "💬 *AI Chat rejimi yoqildi!*\n\n" +
    "Endi menga savollaringizni yuborishingiz mumkin."
  );
});

bot.action("turn_off", (ctx) => {
  chatMode = false;
  ctx.answerCbQuery("⛔ Chat o'chirildi");
  ctx.replyWithMarkdown(
    "🔇 *AI Chat rejimi o'chirildi.*\n\n" +
    "Yana chatni boshlash uchun /on buyrug'ini yuboring yoki " +
    "\"Chatni yoqish\" tugmasini bosing."
  );
});

bot.action("back_to_main", (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(
    "🏠 *Bosh menyu*\n\n" +
    "Quyidagi tugmalardan birini tanlang:",
    Markup.inlineKeyboard([
      [
        { text: "ℹ️ Bot haqida", callback_data: "about_bot" },
        { text: "⚙️ Sozlamalar", callback_data: "settings" }
      ],
      [
        { text: "🌐 Kanal", url: "https://t.me/veranix1" },
        { text: "💬 Chatni boshlash", callback_data: "start_chat" }
      ]
    ])
  );
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  ctx.replyWithMarkdown(
    "❌ *Xatolik yuz berdi!*\n" +
    "Iltimos, keyinroq qayta urinib ko'ring."
  );
});

// Launch bot
bot.launch()
  .then(() => {
    console.log("🤖 Bot muvaffaqiyatli ishga tushirildi!");
    console.log(`🆔 Bot ID: ${bot.botInfo.id}`);
    console.log(`👤 Bot username: @${bot.botInfo.username}`);
  })
  .catch((err) => {
    console.error("Botni ishga tushirishda xatolik:", err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));