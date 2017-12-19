const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const request = require('request-promise-native');
const Command = require('./command');
const log = require('./log');
const locale = require('./locale');
const work = require('./work');
const {
  setTime: userSetTime,
  register: registerUser,
  getById: getUserById,
  setTimezone: setUserTimezone,
} = require('./user');
const {
  getTimezones,
} = require('./timezones');
const {
  div,
  roundToNearest,
  getTimezonefromOffset,
  getTimezoneFromUserTime,
  parseTimezoneToOffset,
} = require('./utils');


const removeKeyboardMarkup = Extra.markup(markup => markup.removeKeyboard());

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
};

const messageHandler = async (ctx, next) => {
  log('Message received', JSON.stringify(ctx.message));
  return next();
};

const actionHandler = async (ctx, next) => {
  log('Action received', JSON.stringify(ctx.update));
  return next();
};

const startHandler = async ctx => {
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

  return ctx.reply(locale.welcome(language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
  }));
};

const setTimezoneHandler = ctx => {
  const message = locale.setTimeZone(ctx.from.language_code, {
    GET_TIMEZONE_FROM_TIME_COMMAND: Command.GET_TIMEZONE_FROM_TIME,
    SELECT_TIMEZONE_COMMAND: Command.SELECT_TIMEZONE,
  });

  return ctx.reply(message, Extra.markup(markup => {
    return markup.keyboard([
      markup.locationRequestButton(locale.sendLocation(ctx.from.language_code)),
    ]).resize().oneTime();
  }));
};

const setTimeHandler = async ctx => {
  const user = await getUserById(ctx.from.id);
  if (!user.timezone) {
    return setTimezoneHandler(ctx);
  }

  return ctx.replyWithMarkdown(locale.setTime(ctx.from.language_code), Extra.markup(markup => {
    return markup.inlineKeyboard(getTimeCommands(markup));
  }));
};

const setTimeActionHandler = async ctx => {
  const [, timestring] = ctx.match;
  try {
    await userSetTime(ctx.from.id, parseInt(timestring, 10));
  } catch (err) {
    log('ERROR', 'userSetTime', timestring);
  }

  const message = locale.timeUpdated(ctx.from.language_code, {
    RECEIVING_TIME: `${timestring}:00`,
  });
  await ctx.answerCbQuery(message);
  await ctx.deleteMessage();
  return ctx.reply(message);
};

const getTimeZoneFromTimeHandler = ctx => ctx.replyWithMarkdown(locale.sendMeYourTime(ctx.from.language_code, {
  SET_TIMEZONE_FROM_TIME_COMMAND: Command.SET_TIMEZONE_FROM_TIME,
}), removeKeyboardMarkup);

const TBT_REGEXP = /\/tbt ([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])/;
const setTimezoneFromTimeHandler = async ctx => {
  const text = ctx.message.text.trim();
  
  if (!TBT_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(ctx.from.language_code));
    return getTimeZoneFromTimeHandler(ctx);
  }

  const [, h, m] = TBT_REGEXP.exec(text);
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  const timezone = getTimezoneFromUserTime(hour, minute);
  const timezoneOffset = parseTimezoneToOffset(timezone);
  await setUserTimezone(ctx.from.id, timezoneOffset);
  return ctx.reply(locale.timezoneUpdated(ctx.from.language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
    TIMEZONE: timezone,
  }));
};

const setUTCCommonHandler = ctx => ctx.replyWithMarkdown(locale.selectTimeZone(ctx.from.language_code, {
  SET_UTC_COMMAND: Command.SET_UTC,
}), removeKeyboardMarkup);

const SET_UTC_REGEXP = /^\/setutc (Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$/;
const setUTCHandler = async ctx => {
  const text = ctx.message.text.trim();

  if (!SET_UTC_REGEXP.test(text)) {
    await ctx.reply(locale.wrongFormat(ctx.from.language_code));
    return setUTCCommonHandler(ctx);
  }

  const [, timezone] = SET_UTC_REGEXP.exec(text);
  const timezoneOffset = parseTimezoneToOffset(timezone);
  await setUserTimezone(ctx.from.id, timezoneOffset);
  return ctx.reply(locale.timezoneUpdated(ctx.from.language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
    TIMEZONE: timezone,
  }));
};

const locationHandler = async ctx => {
  const {latitude, longitude} = ctx.message.location;
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${Math.floor(Date.now() / 1000)}&key=${process.env.GOOGLE_TIMEZONE_API_KEY}`;
  let data;
  try {
    data = JSON.parse(await request.get(url));
  } catch (err) {
    ctx.reply(locale.genericError(ctx.from.language_code));
  }

  if (data.status !== 'OK') {
    return ctx.reply(locale.genericError(ctx.from.language_code));
  }

  const timezone = getTimezonefromOffset(data.rawOffset);
  await setUserTimezone(ctx.from.id, data.rawOffset);
  return ctx.reply(locale.timezoneUpdated(ctx.from.language_code, {
    SET_TIME_COMMAND: Command.SET_TIME,
    TIMEZONE: timezone,
  }), removeKeyboardMarkup);
};

const getHandler = async ctx => {
  const user = await getUserById(ctx.from.id);
  if (!user) {
    return ctx.reply(locale.notRegistered(ctx.from.language_code));
  }

  const result = await work(user);
  if (!result) {
    return ctx.reply(locale.noReleasesToday(user.lang));
  }

  return;
};

module.exports = {
  actionHandler,
  setTimeActionHandler,
  getTimeZoneFromTimeHandler,
  getHandler,
  setUTCCommonHandler,
  setTimeHandler,
  setTimezoneFromTimeHandler,
  setTimezoneHandler,
  setUTCHandler,
  locationHandler,
  messageHandler,
  startHandler,
};
