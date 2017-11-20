require('dotenv').config();
const Telegram = require('telegraf/telegram');


module.exports = new Telegram(process.env.BOT_TOKEN);
