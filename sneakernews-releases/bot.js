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
const removeKeyboardMarkup = Extra.markup(markup => markup.removeKeyboard());

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
    return setTimezoneHandler(ctx);
    // return ctx.reply(locale.noTimezone(ctx.from.language_code, {
    //   SET_TIMEZONE_COMMAND: Command.SET_TIMEZONE,
    // }));
  }

  return ctx.replyWithMarkdown(locale.setTime(ctx.from.language_code), Extra.markup(markup => {
    return markup.inlineKeyboard(getTimeCommands(markup));
  }))
});

bot.action(/settime([0-2][0-9])00/, async ctx => {
  const [, timestring] = ctx.match;
  await userSetTime(ctx.from.id, parseInt(timestring, 10));

  const message = locale.timeUpdated(ctx.from.language_code, {
    RECEIVING_TIME: `${timestring}:00`,
  });
  await ctx.answerCbQuery(message);
  await ctx.deleteMessage();
  return ctx.reply(message);
});

const setTimezoneHandler = ctx => {
  const message = locale.setTimeZone(ctx.from.language_code, {
    GET_TIMEZONE_FROM_TIME_COMMAND: Command.GET_TIMEZONE_FROM_TIME,
    SELECT_TIMEZONE_COMMAND: Command.SELECT_TIMEZONE,
  });

  return ctx.reply(message, Extra.markup(markup => {
    return markup.keyboard([
      markup.locationRequestButton('Отправить геолокацию'),
    ]).resize().oneTime();
  }));
}

bot.command(Command.SET_TIMEZONE, setTimezoneHandler);

const getTimeZoneFromTimeHandler = ctx => ctx.replyWithMarkdown(locale.sendMeYourTime(ctx.from.language_code, {
  SET_TIMEZONE_FROM_TIME_COMMAND: Command.SET_TIMEZONE_FROM_TIME,
}), removeKeyboardMarkup);

bot.command(Command.GET_TIMEZONE_FROM_TIME, getTimeZoneFromTimeHandler);

const div = (val, by) => (val - val % by) / by;

// ебаный насос
const getTimezoneFromUserTime = (hour, minute) => {
  const now = new Date();
  const userDate = new Date();
  userDate.setHours(hour);
  userDate.setMinutes(minute);
  const delta = userDate - now;
  let minuteDelta = div(delta, 1000 * 60);
  if (minuteDelta > (60 * 12)) {
    console.log(minuteDelta, '>');
    minuteDelta = -24 * 60 + minuteDelta;
  }

  if (minuteDelta <= (-60 * 12)) {
    console.log(minuteDelta, '<');
    minuteDelta = minuteDelta + 24 * 60;
  }

  console.log('md', minuteDelta);

  const ma = Math.abs(minuteDelta);
  let h1 = div(ma, 60);
  const m1 = ma % 60;
  const m2 = Math.round(m1 / 30);
  let x = '00';
  if (m2 === 1) {
    x = '30';
  }
  if (m2 === 2) {
    h1 += 1;
  }
  return (minuteDelta < -15 && minuteDelta > 60 * -24) ? `-${h1}:${x}` : `+${h1}:${x}`;
}

const TBT_REGEXP = /\/tbt ([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])/;
bot.command(Command.SET_TIMEZONE_FROM_TIME, async ctx => {
  const text = ctx.message.text.trim();
  
  if (!TBT_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(ctx.from.language_code));
    return getTimeZoneFromTimeHandler(ctx);
  }

  const [, h, m] = TBT_REGEXP.exec(text);
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);

  await setUserTimezone(ctx.from.id, getTimezoneFromUserTime(hour, minute));
  return ctx.reply(locale.timezoneUpdated(ctx.from.language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
  }));
});

const setUTCCommonHandler = ctx => ctx.replyWithMarkdown(locale.selectTimeZone(ctx.from.language_code, {
  SET_UTC_COMMAND: Command.SET_UTC,
}), removeKeyboardMarkup);
const SET_UTC_REGEXP = /^\/setutc (Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$/;

bot.command(Command.SELECT_TIMEZONE, setUTCCommonHandler);

bot.command(Command.SET_UTC, async ctx => {
  const text = ctx.message.text.trim();

  if (!SET_UTC_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(ctx.from.language_code));
    return setUTCCommonHandler(ctx);
  }

  const [, timezone] = SET_UTC_REGEXP.exec(text);
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
