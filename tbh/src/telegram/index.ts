import Telegraf, { Telegram, Middleware } from 'telegraf';
import { ExtraReplyMessage, User } from 'telegraf/typings/telegram-types';
import * as TE from 'fp-ts/lib/TaskEither';
import * as IO from 'fp-ts/lib/IO';
import * as RT from 'fp-ts/lib/ReaderTask';
import { identity } from 'fp-ts/lib/function';
import { TelegrafContext } from 'telegraf/typings/context';

export const setWebhook = (telegram: Telegram, url: string): TE.TaskEither<unknown, boolean> =>
  TE.tryCatch(() => telegram.setWebhook(url), identity);

export const getMe = (telegram: Telegram): TE.TaskEither<unknown, User> =>
  TE.tryCatch(() => telegram.getMe(), identity);

export const startWebhook = (
  telegraf: Telegraf<TelegrafContext>,
  path: string,
  port?: number
): IO.IO<void> => () => telegraf.startWebhook(path, null, port);

export const reply = TE.tryCatchK(
  (ctx: TelegrafContext, text: string, extra?: ExtraReplyMessage) => ctx.reply(text, extra),
  identity
);

export const getMiddleware = (
  a: RT.ReaderTask<TelegrafContext, unknown>
): Middleware<TelegrafContext> => ctx => RT.run(a, ctx);
