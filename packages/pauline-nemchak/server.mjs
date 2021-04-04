import dotenv from 'dotenv';
import Telegraf from 'telegraf';


dotenv.config();

const app = new Telegraf(process.env.BOT_TOKEN, {username: 'pauline_nemchak_bot'});

const BASE_STRING = 'ах';
const AHAH_MAX_LENGTH = 4;

const START_MESSAGE = 'Отправь мне команду /ahah чтобы получить порцию ахахов, /sexism чтобы обозначить сексистский выпад, /notagain если тебе не нравится текущая тема дискуссии и /nou чтобы отразить оскорбление оппонента';
const SEXISM_MESSAGE = 'ах ты сексист';
const NO_U_MESSAGE = 'нет ты';
const NOTAGAIN_MESSAGE = 'начинается';

const getRandomAhah = _ => BASE_STRING.padStart(Math.ceil(Math.random() * (AHAH_MAX_LENGTH - 1)) * BASE_STRING.length + BASE_STRING.length, BASE_STRING);

app.use(async (ctx, next) => {
  console.log(`${String(new Date())}: update type ${ctx.updateType}, message ${JSON.stringify(ctx.message)}, from ${JSON.stringify(ctx.from)}`);
  return next();
});
app.command('start', ctx => ctx.reply(START_MESSAGE));
app.command('ahah', ctx => ctx.reply(getRandomAhah()));
app.command('sexism', ctx => ctx.reply(SEXISM_MESSAGE));
app.command('nou', ctx => ctx.reply(NO_U_MESSAGE));
app.command('notagain', ctx => ctx.reply(NOTAGAIN_MESSAGE));

app.startPolling();
