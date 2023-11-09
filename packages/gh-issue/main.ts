import { Telegraf, Context } from 'telegraf';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

interface MyContext extends Context {
  match?: RegExpExecArray;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID || '';
const MY_TELEGRAM_ID = process.env.MY_TELEGRAM_ID || '';
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || '';

if (
  !TELEGRAM_BOT_TOKEN ||
  !GITHUB_TOKEN ||
  !ALLOWED_CHAT_ID ||
  !MY_TELEGRAM_ID ||
  !GITHUB_REPO_OWNER ||
  !GITHUB_REPO_NAME
) {
  console.error('Please set all the required environment variables in .env');
  process.exit(1);
}

const bot = new Telegraf<MyContext>(TELEGRAM_BOT_TOKEN);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

bot.use(async (ctx, next) => {
  // Only work in the specified group chat
  if (ctx.chat?.id.toString() === ALLOWED_CHAT_ID) {
    return next();
  } else {
    await ctx.reply("Sorry, I'm not allowed to interact with chats other than my specified group.");
    return;
  }
});

bot.command('issue', async (ctx) => {
  try {
    // Parses commands starting with /issue. The issue title is required and the
    // description is optional. E.g., /issue "Feature Request" "Need dark mode."
    const match = ctx.message.text.match(
      /^\/issue@ergonaut_github_issues_bot "?([^"]+)"?(?: "?([^"]+)"?)?/,
    );
    if (!match) {
      await ctx.reply(
        'Please provide an issue title (and optionally an issue description) following the command.',
      );
      return;
    }

    const title = match[1];
    const body = match[2] || '';

    // Create a GitHub issue
    const { data } = await octokit.issues.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title,
      body,
    });

    // Reply with the issue URL
    await ctx.reply(`Issue created: ${data.html_url}`);
  } catch (error) {
    console.error(error);
    ctx.telegram.sendMessage(
      MY_TELEGRAM_ID,
      `Error creating GitHub issue: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

bot.catch((error: unknown, ctx: MyContext) => {
  // Ensure that 'error' is an instance of Error before trying to access its properties
  if (error instanceof Error) {
    console.error(`Telegraf error for update ${ctx.update.update_id}: ${error.message}`);
    ctx.telegram.sendMessage(MY_TELEGRAM_ID, `Bot error: ${error.message}`);
  } else {
    // Handle cases where 'error' might not be an Error instance
    console.error(`Telegraf error for update ${ctx.update.update_id}: `, error);
    ctx.telegram.sendMessage(MY_TELEGRAM_ID, `Bot error: ${String(error)}`);
  }
});

bot.launch().then(() => {
  console.log('bot started');
});
