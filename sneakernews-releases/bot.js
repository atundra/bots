require('dotenv').config();
const Extra = require('telegraf/extra');
const Telegraf = require('telegraf');
const locale = require('./locale');
const log = require('./log');
const {
  setTime: userSetTime,
  register: registerUser,
  getById: getUserById,
  setTimezone: setUserTimezone,
} = require('./user');
const work = require('./work');
const {getTimezones} = require('./timezones');


const bot = new Telegraf(process.env.BOT_TOKEN);
const SET_REGEXP = /\/set ([01]?[0-9]|2[0-3]):([0-5][0-9]) ([01]?[0-9]|2[0-3]):([0-5][0-9])/;

const Command = {
  GET_TIMEZONE_FROM_TIME: 'timezonebytime',
  SELECT_TIMEZONE: 'selecttimezone',
  SET_UTC: 'setutc',
  SET_TIME: 'time',
  SET_TIMEZONE: 'settimezone',
  SET_TIMEZONE_FROM_TIME: 'tbt',
};

bot.on('message', (ctx, next) => {
  log('Message received', JSON.stringify(ctx.message));
  return next();
});

bot.action(/.*/, (ctx, next) => {
  log('Action received', JSON.stringify(ctx.update));
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
    return ctx.reply(locale.alreadyRegistered(language_code, {
      SET_TIME_COMMAND: Command.SET_TIME,
    }));
  }

  return ctx.reply(locale.welcome(language_code));
});

const getTimeCommands = m => {
  return [
    [
      m.callbackButton('00:00', 'settime0000'),
      m.callbackButton('01:00', 'settime0100'),
      m.callbackButton('02:00', 'settime0200'),
    ],
    [
      m.callbackButton('03:00', 'settime0300'),
      m.callbackButton('04:00', 'settime0400'),
      m.callbackButton('05:00', 'settime0500'),
    ],
    [
      m.callbackButton('06:00', 'settime0600'),
      m.callbackButton('07:00', 'settime0700'),
      m.callbackButton('08:00', 'settime0800'),
    ],
    [
      m.callbackButton('09:00', 'settime0900'),
      m.callbackButton('10:00', 'settime1000'),
      m.callbackButton('11:00', 'settime1100'),
    ],
    [
      m.callbackButton('12:00', 'settime1200'),
      m.callbackButton('13:00', 'settime1300'),
      m.callbackButton('14:00', 'settime1400'),
    ],
    [
      m.callbackButton('15:00', 'settime1500'),
      m.callbackButton('16:00', 'settime1600'),
      m.callbackButton('17:00', 'settime1700'),
    ],
    [
      m.callbackButton('18:00', 'settime1800'),
      m.callbackButton('19:00', 'settime1900'),
      m.callbackButton('20:00', 'settime2000'),
    ],
    [
      m.callbackButton('21:00', 'settime2100'),
      m.callbackButton('22:00', 'settime2200'),
      m.callbackButton('23:00', 'settime2300'),
    ],
  ];
}

bot.command(Command.SET_TIME, async ctx => {
  const user = await getUserById(ctx.from.id);
  if (!user.timezone) {
    return ctx.reply(locale.noTimezone(ctx.from.language_code, {
      SET_TIMEZONE_COMMAND: Command.SET_TIMEZONE,
    }));
  }

  return ctx.replyWithMarkdown(locale.setTime(ctx.from.language_code), Extra.markup(markup => {
    return markup.inlineKeyboard(getTimeCommands(markup));
  }))
});

bot.action(/settime([0-2][0-9])00/, async ctx => {
  const [match, timestring] = ctx.match;
  await userSetTime(ctx.from.id, parseInt(timestring, 10));

  const message = locale.timeUpdated(ctx.from.language_code, {
    RECEIVING_TIME: `${timestring}:00`,
  });
  await ctx.answerCbQuery(message);
  await ctx.deleteMessage();
  return ctx.reply(message);
});

bot.command(Command.SET_TIMEZONE, ctx => {
  const message = locale.setTimeZone(ctx.from.language_code, {
    GET_TIMEZONE_FROM_TIME_COMMAND: Command.GET_TIMEZONE_FROM_TIME,
    SELECT_TIMEZONE_COMMAND: Command.SELECT_TIMEZONE,
  });

  return ctx.reply(message, Extra.markup(markup => {
    return markup.keyboard([
      markup.locationRequestButton('Отправить геолокацию'),
    ]).resize().oneTime();
  }));
});

bot.command(Command.GET_TIMEZONE_FROM_TIME, ctx => ctx.replyWithMarkdown(locale.sendMeYourTime(ctx.from.language_code, {
  SET_TIMEZONE_FROM_TIME_COMMAND: Command.SET_TIMEZONE_FROM_TIME,
})));

const setUTCCommonHandler = ctx => ctx.replyWithMarkdown(locale.selectTimeZone(ctx.from.language_code, {
  SET_UTC_COMMAND: Command.SET_UTC,
}), Extra.markup(markup => markup.removeKeyboard()));
const SET_UTC_REGEXP = /^\/setutc (Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$/;

bot.command(Command.SELECT_TIMEZONE, setUTCCommonHandler);

bot.command(Command.SET_UTC, async ctx => {
  const text = ctx.message.text.trim();

  if (!SET_UTC_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(ctx.from.language_code));
    return setUTCCommonHandler(ctx);
  }

  const [match, timezone] = SET_UTC_REGEXP.exec(text);
  await setUserTimezone(ctx.from.id, timezone);
  return ctx.reply(locale.timezoneUpdated(ctx.from.language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
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
