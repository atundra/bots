require('dotenv').config();
const Telegraf = require('telegraf');
const locale = require('./locale');
const {setTime: userSetTime, register: registerUser} = require('./user');


const bot = new Telegraf(process.env.BOT_TOKEN);
const SET_REGEXP = /\/set ([01]?[0-9]|2[0-3]):([0-5][0-9]) ([01]?[0-9]|2[0-3]):([0-5][0-9])/;

bot.start(async ctx => {
  const {
    id,
    is_bot,
    first_name,
    username,
    language_code,
  } = ctx.from;

  const [user, created] = await registerUser(id, language_code);
  if (!created) {
    return ctx.reply(locale.alreadyRegistered(language_code));
  }

  return ctx.reply(locale.welcome(language_code));
})
bot.command('settime', ctx => ctx.replyWithMarkdown(locale.setTime(ctx.from.language_code)));
bot.command('set', async ctx => {
  const text = ctx.message.text.trim();
  const lang = ctx.from.language_code;

  if (!SET_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(lang));
    return ctx.replyWithMarkdown(locale.setTime(lang));
  }

  const [
    source,
    currentHour,
    currentMinute,
    expectedHour,
    expectedMinute,
  ] = SET_REGEXP.exec(text);

  const now = new Date();
  const nowHour = now.getHours();
  const utcDelta = nowHour - currentHour;
  const subscriptionHour = +expectedHour + utcDelta;
  const id = ctx.from.id;
  await userSetTime(id, subscriptionHour % 24, +expectedMinute);
  return ctx.reply(locale.timeUpdated(lang));
});

module.exports = bot.startPolling.bind(bot);
