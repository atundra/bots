import dotenv from 'dotenv';
import Telegraf from 'telegraf';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const getResult = text => ({
	type: 'article',
	id: Math.random() * 10000,
	title: text,
	input_message_content: {
		message_text: text,
	},
});

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
  const r = inlineQuery.query.split('').join(' ');
  const results = [getResult(r), getResult(r.toUpperCase())];
  return answerInlineQuery(inlineQuery.query ? results : []);
})

const main = async () => {
	const me = await bot.telegram.getMe();
	bot.options.username = me.username;
	bot.startPolling();
}

main();
