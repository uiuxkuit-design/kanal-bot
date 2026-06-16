const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8259123280:AAEcqs6-LaEfpv8ZthiVoCORoRxxUrpwiWQ';
const ADMIN_ID = 591146270;
const CHANNEL_LINK = 'https://t.me/+JQ8ZKcRxu8IyZmYy';
const CARD_NUMBER = '5614681850440813';
const PRICE = '100,000 so\'m';

const bot = new Telegraf(BOT_TOKEN);

// Pending users: { userId: { username, firstName } }
const pendingUsers = {};

// /start
bot.start((ctx) => {
  const name = ctx.from.first_name || 'Foydalanuvchi';
  ctx.reply(
    `👋 Salom, ${name}!\n\n` +
    `📢 Kanalga kirish uchun to'lov qiling:\n\n` +
    `💳 Karta raqami: <code>${CARD_NUMBER}</code>\n` +
    `💰 Summa: <b>${PRICE}</b>\n\n` +
    `✅ To'lovni amalga oshirgach, <b>chek (screenshot)</b> yuboring.\n` +
    `Admin tekshirib, kanal linkini yuboradi.`,
    { parse_mode: 'HTML' }
  );
});

// Screenshot qabul qilish
bot.on('photo', async (ctx) => {
  const user = ctx.from;
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  pendingUsers[user.id] = {
    username: user.username || '',
    firstName: user.first_name || '',
  };

  // Usergа tasdiqlash kutilmoqda xabari
  await ctx.reply(
    '✅ Chekingiz qabul qilindi!\n' +
    '⏳ Admin tekshirgach, kanal linki yuboriladi. Biroz kuting.'
  );

  // Adminga xabar + screenshot + tugmalar
  const userInfo =
    `👤 Ism: ${user.first_name || ''}` +
    (user.username ? ` (@${user.username})` : '') +
    `\n🆔 ID: <code>${user.id}</code>`;

  await bot.telegram.sendPhoto(ADMIN_ID, fileId, {
    caption:
      `💳 Yangi to'lov cheki!\n\n${userInfo}\n\n` +
      `Tasdiqlaysizmi?`,
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Tasdiqlash', `approve_${user.id}`),
        Markup.button.callback('❌ Rad etish', `reject_${user.id}`),
      ],
    ]),
  });
});

// Document (fayl sifatida screenshot)
bot.on('document', async (ctx) => {
  const user = ctx.from;
  const fileId = ctx.message.document.file_id;

  pendingUsers[user.id] = {
    username: user.username || '',
    firstName: user.first_name || '',
  };

  await ctx.reply(
    '✅ Chekingiz qabul qilindi!\n' +
    '⏳ Admin tekshirgach, kanal linki yuboriladi. Biroz kuting.'
  );

  const userInfo =
    `👤 Ism: ${user.first_name || ''}` +
    (user.username ? ` (@${user.username})` : '') +
    `\n🆔 ID: <code>${user.id}</code>`;

  await bot.telegram.sendDocument(ADMIN_ID, fileId, {
    caption:
      `💳 Yangi to'lov cheki!\n\n${userInfo}\n\nTasdiqlaysizmi?`,
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Tasdiqlash', `approve_${user.id}`),
        Markup.button.callback('❌ Rad etish', `reject_${user.id}`),
      ],
    ]),
  });
});

// Tasdiqlash tugmasi
bot.action(/^approve_(\d+)$/, async (ctx) => {
  const userId = parseInt(ctx.match[1]);

  try {
    await bot.telegram.sendMessage(
      userId,
      `🎉 To'lovingiz tasdiqlandi!\n\n` +
      `📢 Kanalga kirish linki:\n${CHANNEL_LINK}`
    );

    await ctx.editMessageCaption(
      ctx.callbackQuery.message.caption +
      '\n\n✅ <b>TASDIQLANDI</b>',
      { parse_mode: 'HTML' }
    );

    await ctx.answerCbQuery('✅ Foydalanuvchiga link yuborildi!');
    delete pendingUsers[userId];
  } catch (e) {
    await ctx.answerCbQuery('❌ Xatolik: ' + e.message);
  }
});

// Rad etish tugmasi
bot.action(/^reject_(\d+)$/, async (ctx) => {
  const userId = parseInt(ctx.match[1]);

  try {
    await bot.telegram.sendMessage(
      userId,
      `❌ Afsuski, to'lovingiz tasdiqlanmadi.\n\n` +
      `❓ Muammo bo'lsa, admin bilan bog'laning.`
    );

    await ctx.editMessageCaption(
      ctx.callbackQuery.message.caption +
      '\n\n❌ <b>RAD ETILDI</b>',
      { parse_mode: 'HTML' }
    );

    await ctx.answerCbQuery('❌ Foydalanuvchiga rad xabari yuborildi.');
    delete pendingUsers[userId];
  } catch (e) {
    await ctx.answerCbQuery('❌ Xatolik: ' + e.message);
  }
});

// /approve [user_id] — buyruq bilan tasdiqlash
bot.command('approve', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const args = ctx.message.text.split(' ');
  const userId = parseInt(args[1]);
  if (!userId) return ctx.reply('❗ Foydalanish: /approve 123456789');

  try {
    await bot.telegram.sendMessage(
      userId,
      `🎉 To'lovingiz tasdiqlandi!\n\n📢 Kanalga kirish linki:\n${CHANNEL_LINK}`
    );
    await ctx.reply(`✅ ${userId} ga link yuborildi.`);
    delete pendingUsers[userId];
  } catch (e) {
    await ctx.reply('❌ Xatolik: ' + e.message);
  }
});

// /reject [user_id] — buyruq bilan rad etish
bot.command('reject', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const args = ctx.message.text.split(' ');
  const userId = parseInt(args[1]);
  if (!userId) return ctx.reply('❗ Foydalanish: /reject 123456789');

  try {
    await bot.telegram.sendMessage(
      userId,
      `❌ Afsuski, to'lovingiz tasdiqlanmadi.\n❓ Muammo bo'lsa, admin bilan bog'laning.`
    );
    await ctx.reply(`❌ ${userId} ga rad xabari yuborildi.`);
    delete pendingUsers[userId];
  } catch (e) {
    await ctx.reply('❌ Xatolik: ' + e.message);
  }
});

// /pending — kutayotgan userlar ro'yxati
bot.command('pending', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const list = Object.entries(pendingUsers);
  if (list.length === 0) return ctx.reply('📭 Hozircha kutayotgan foydalanuvchi yo\'q.');

  const text = list
    .map(([id, u]) => `• ${u.firstName}${u.username ? ' @' + u.username : ''} — ID: <code>${id}</code>`)
    .join('\n');

  ctx.reply(`⏳ Kutayotganlar:\n\n${text}`, { parse_mode: 'HTML' });
});

bot.launch();
console.log('✅ Bot ishga tushdi!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
