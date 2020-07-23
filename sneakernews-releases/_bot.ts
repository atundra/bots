import Telegraf from 'telegraf';
import { getConfigUnsafe } from './config';
import * as IO from 'fp-ts/lib/IO';
import { TelegrafContext } from 'telegraf/typings/context';
import { UpdateType } from 'telegraf/typings/telegram-types';
import { TelegrafOptions } from 'telegraf/typings/telegraf';
import { pipe } from 'fp-ts/lib/function';

const create = (token: string, options?: TelegrafOptions) =>
  pipe(new Telegraf(token, options), (bot) => {
    // bot.action(/.*/, actionHandler);
    // bot.action(/settime([0-2][0-9])00/, setTimeActionHandler);
    // bot.command(Command.GET_TIMEZONE_FROM_TIME, getTimeZoneFromTimeHandler);
    // bot.command(Command.GET, getHandler);
    // bot.command(Command.SELECT_TIMEZONE, setUTCCommonHandler);
    // bot.command(Command.SET_TIME, setTimeHandler);
    // bot.command(Command.SET_TIMEZONE_FROM_TIME, setTimezoneFromTimeHandler);
    // bot.command(Command.SET_TIMEZONE, setTimezoneHandler);
    // bot.command(Command.SET_UTC, setUTCHandler);
    // bot.on('location', locationHandler);
    // bot.on('message', messageHandler);
    // bot.start(startHandler);
  });

const runLongPolling = (
  timeout?: number,
  limit?: number,
  allowedUpdates?: UpdateType[] | UpdateType | null,
  stopCallback?: () => void | null
) => (bot: Telegraf<TelegrafContext>): IO.IO<void> => () =>
  bot.startPolling(timeout, limit, allowedUpdates, stopCallback);

// const a = (bot: Telegraf<TelegrafContext>) => bot.on()

const bot = create(getConfigUnsafe(process.env).BOT_TOKEN);
