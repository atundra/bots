import Telegraf, { Telegram, Middleware } from 'telegraf';
import { ExtraReplyMessage, User } from 'telegraf/typings/telegram-types';
import * as TE from 'fp-ts/lib/TaskEither';
import * as IO from 'fp-ts/lib/IO';
import * as RT from 'fp-ts/lib/ReaderTask';
import { TelegrafContext } from 'telegraf/typings/context';

export class TelegramError extends Error {}

export const setWebhook = (
  telegram: Telegram,
  url: string
): TE.TaskEither<TelegramError, boolean> =>
  TE.tryCatch(
    () => telegram.setWebhook(url),
    e => new TelegramError(String(e))
  );

export const getMe = (telegram: Telegram): TE.TaskEither<TelegramError, User> =>
  TE.tryCatch(
    () => telegram.getMe(),
    e => new TelegramError(String(e))
  );

export const startWebhook = (
  telegraf: Telegraf<TelegrafContext>,
  path: string,
  port?: number
): IO.IO<void> => () => telegraf.startWebhook(path, null, port);

export const reply = TE.tryCatchK(
  (ctx: TelegrafContext, text: string, extra?: ExtraReplyMessage) => ctx.reply(text, extra),
  e => new TelegramError(String(e))
);

export const getMiddleware = (
  a: RT.ReaderTask<TelegrafContext, unknown>
): Middleware<TelegrafContext> => ctx => RT.run(a, ctx);
