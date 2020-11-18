import { pipe } from "fp-ts/function";
import { Telegram } from "telegraf";
import { TelegramOptions } from "telegraf/typings/telegram";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { TelegramError } from "telegraf/core/network/error";
import type { ExtraEditMessage, Message } from "telegraf/typings/telegram-types";
import * as C from "fp-ts/Console";
import { config } from "dotenv";

config();

const telegram = (t: string, o?: TelegramOptions) => new Telegram(t, o);

type ChatIdT = string | number;

const sendMessage = (chatId: ChatIdT, text: string, extra?: ExtraEditMessage) => (
  ti: Telegram
): TE.TaskEither<TelegramError, Message> =>
  TE.tryCatch(
    () => ti.sendMessage(chatId, text, extra),
    (e: TelegramError) => e
  );

const chatId = () => Number(process.env.CHAT_ID);
const telegramToken = () => process.env.BOT_TELEGRAM_TOKEN;

const sendText = (tgToken: string) => (chatId: ChatIdT) => (text: string) =>
  pipe(tgToken, telegram, sendMessage(chatId, text));

const main = pipe(
  "Test message",
  sendText(telegramToken())(chatId()),
  TE.fold(T.fromIOK(C.error), T.fromIOK(C.log))
);

main();
