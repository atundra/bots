require('dotenv').config();
const Telegraf = require('telegraf');
const Command = require('./command');
const {
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
} = require('./handlers');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.action(/.*/, actionHandler);
bot.action(/settime([0-2][0-9])00/, setTimeActionHandler);
bot.command(Command.GET_TIMEZONE_FROM_TIME, getTimeZoneFromTimeHandler);
bot.command(Command.GET, getHandler);
bot.command(Command.SELECT_TIMEZONE, setUTCCommonHandler);
bot.command(Command.SET_TIME, setTimeHandler);
bot.command(Command.SET_TIMEZONE_FROM_TIME, setTimezoneFromTimeHandler);
bot.command(Command.SET_TIMEZONE, setTimezoneHandler);
bot.command(Command.SET_UTC, setUTCHandler);
bot.on('location', locationHandler);
bot.on('message', messageHandler);
bot.start(startHandler);

module.exports = bot.startPolling.bind(bot);
