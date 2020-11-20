import Telegraf, { Telegram } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import * as TE from 'fp-ts/lib/TaskEither';
import * as IO from 'fp-ts/lib/IO';
import { identity } from 'fp-ts/lib/function';
import { TelegrafContext } from 'telegraf/typings/context';

export const setWebhook = (telegram: Telegram, url: string): TE.TaskEither<unknown, boolean> =>
  TE.tryCatch(() => telegram.setWebhook(url), identity);

export const startWebhook = (
  telegraf: Telegraf<TelegrafContext>,
  path: string,
  port?: number
): IO.IO<void> => () => telegraf.startWebhook(path, null, port);

export const reply = TE.tryCatchK(
  (ctx: TelegrafContext, text: string, extra?: ExtraReplyMessage) => ctx.reply(text, extra),
  identity
);
