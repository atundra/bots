import { Telegraf, Telegram } from 'telegraf';
import { TelegrafOptions } from 'telegraf/typings/telegraf';
import { TelegramOptions } from 'telegraf/typings/telegram';
import * as TE from 'fp-ts/TaskEither';
import type {
  ExtraEditMessage,
  ExtraMediaGroup,
  ExtraPhoto,
  InputFile,
  Message,
  MessageMedia,
  MessagePhoto,
} from 'telegraf/typings/telegram-types';
import { ArrayOf2PlusN } from './utils';

export const telegraf = (t: string, o?: TelegrafOptions) => new Telegraf(t, o);

export const telegram = (t: string, o?: TelegramOptions) => new Telegram(t, o);

export type ChatIdT = string | number;

export const sendMessage =
  (chatId: ChatIdT, text: string, extra?: ExtraEditMessage) =>
  (ti: Telegram): TE.TaskEither<Error, Message> =>
    TE.tryCatch(
      () => ti.sendMessage(chatId, text, extra),
      (e: unknown) => e as Error,
    );

export const sendPhoto =
  (chatId: ChatIdT, photo: InputFile, extra?: ExtraPhoto) =>
  (ti: Telegram): TE.TaskEither<Error, MessagePhoto> =>
    TE.tryCatch(
      () => ti.sendPhoto(chatId, photo, extra),
      (e: unknown) => e as Error,
    );

export const sendMediaGroup =
  (chatId: ChatIdT, media: ArrayOf2PlusN<MessageMedia>, extra?: ExtraMediaGroup) =>
  (ti: Telegram): TE.TaskEither<Error, unknown> =>
    TE.tryCatch(
      () => ti.sendMediaGroup(chatId, media, extra),
      (e: unknown) => e as Error,
    );
