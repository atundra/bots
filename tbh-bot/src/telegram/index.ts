import { Telegram } from 'telegraf';
import { TelegramOptions } from 'telegraf/typings/telegram';
import { Message, ExtraEditMessage } from 'telegraf/typings/telegram-types';
import * as TE from 'fp-ts/lib/TaskEither';
import { identity } from 'fp-ts/lib/function';

export const createTelegram = (token: string, options?: TelegramOptions): Telegram =>
  new Telegram(token, options);

export const setWebhook = (telegram: Telegram, url: string): TE.TaskEither<unknown, boolean> =>
  TE.tryCatch(() => telegram.setWebhook(url), identity);

export const sendMessage = (
  telegram: Telegram,
  chatId: number | string,
  text: string,
  extra?: ExtraEditMessage
): TE.TaskEither<unknown, Message> =>
  TE.tryCatch(() => telegram.sendMessage(chatId, text, extra), identity);
