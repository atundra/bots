require('dotenv').config();
const Extra = require('telegraf/extra');
const Telegraf = require('telegraf');
const locale = require('./locale');
const log = require('./log');
const {setTime: userSetTime, register: registerUser, getById: getUserById} = require('./user');
const work = require('./work');
const {getTimezones} = require('./timezones');


const bot = new Telegraf(process.env.BOT_TOKEN);
const SET_REGEXP = /\/set ([01]?[0-9]|2[0-3]):([0-5][0-9]) ([01]?[0-9]|2[0-3]):([0-5][0-9])/;

const Command = {
  GET_TIMEZONE_FROM_TIME: 'timezonebytime',
  SELECT_TIMEZONE: 'selecttimezone',
};

bot.on('message', (ctx, next) => {
  log('Message received', JSON.stringify(ctx.message));
  return next();
});
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
bot.command('settimezone', ctx => {
  const message = locale.setTimeZone(ctx.from.language_code, {
    GET_TIMEZONE_FROM_TIME_COMMAND: Command.GET_TIMEZONE_FROM_TIME,
    SELECT_TIMEZONE_COMMAND: Command.SELECT_TIMEZONE,
  });

  return ctx.reply(message, Extra.markup(markup => {
    return markup.keyboard([
      markup.locationRequestButton('Отправить геолокацию'),
    ]).resize().oneTime();
  }))
});
bot.command(Command.SELECT_TIMEZONE, async ctx => {
  return ctx.reply(locale.selectTimeZone(ctx.from.language_code), Extra.markup(markup => {
    return markup.keyboard(getTimezones());
  }));
});
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
bot.command('get', async ctx => {
  const user = await getUserById(ctx.from.id);
  if (!user) {
    return ctx.reply(locale.notRegistered(ctx.from.language_code));
  }

  const result = await work(user);
  if (!result) {
    return ctx.reply(locale.noReleasesToday(user.lang));
  }

  return;
});


module.exports = bot.startPolling.bind(bot);
