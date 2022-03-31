import { Api, Bot, Context } from 'grammy';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { RTEfromReaderOption } from './utils';
import {
  readCallerId,
  readAdmins,
  throwIfNotAdmin,
  readMyUid,
  readTargetUid,
  throwIfAlreadyAdmin,
  promote,
  demote,
  readCommandText,
  rename,
  runHandler,
  promoteSuper,
} from './api';

const promoteHandler = () =>
  pipe(
    RTE.Do,
    RTE.bind('callerUid', () =>
      pipe(RTEfromReaderOption(() => 'Чет не могу понять кто ты')(readCallerId())),
    ),
    RTE.bindW('admins', () => readAdmins()),
    // check if caller is admin
    RTE.chainFirstW(({ admins, callerUid }) =>
      throwIfNotAdmin('Ты не админ, сперва получи промоут')(admins, callerUid),
    ),
    RTE.bindW('myUid', () => readMyUid()),
    // check if bot is admin
    RTE.chainFirstW(({ admins, myUid }) =>
      throwIfNotAdmin('Я не админ, дай админку')(admins, myUid),
    ),
    // read target uid
    RTE.bindW('targetUid', () => RTE.fromReaderEither(readTargetUid())),
    // throw if already promoted
    RTE.chainFirstW(({ admins, targetUid }) =>
      throwIfAlreadyAdmin('Уже запромоучен')(admins, targetUid),
    ),
    // read command text
    RTE.bindW('commandText', () => readCommandText()),
    // promote target
    RTE.chainFirstW(({ targetUid, commandText }) =>
      commandText === 'super' ? promoteSuper(targetUid) : promote(targetUid),
    ),
  );

const demoteHandler = () =>
  pipe(
    RTE.Do,
    RTE.bind('callerUid', () =>
      pipe(RTEfromReaderOption(() => 'Чет не могу понять кто ты')(readCallerId())),
    ),
    RTE.bindW('admins', () => readAdmins()),
    // check if caller is admin
    RTE.chainFirstW(({ admins, callerUid }) =>
      throwIfNotAdmin('Ты не админ, сперва получи промоут')(admins, callerUid),
    ),
    RTE.bindW('myUid', () => readMyUid()),
    // check if bot is admin
    RTE.chainFirstW(({ admins, myUid }) =>
      throwIfNotAdmin('Я не админ, дай админку')(admins, myUid),
    ),
    // read target uid
    RTE.bindW('targetUid', () => RTE.fromReaderEither(readTargetUid())),
    // throw if not admin
    RTE.chainFirstW(({ admins, targetUid }) =>
      throwIfNotAdmin('Да это и не админ так то')(admins, targetUid),
    ),
    // demote target
    RTE.chainFirstW(({ targetUid }) => demote(targetUid)),
  );

const renameHandler = () =>
  pipe(
    RTE.Do,
    RTE.bind('callerUid', () =>
      pipe(RTEfromReaderOption(() => 'Чет не могу понять кто ты')(readCallerId())),
    ),
    RTE.bindW('admins', () => readAdmins()),
    // check if caller is admin
    RTE.chainFirstW(({ admins, callerUid }) =>
      throwIfNotAdmin('Ты не админ, сперва получи промоут')(admins, callerUid),
    ),
    RTE.bindW('myUid', () => readMyUid()),
    // check if bot is admin
    RTE.chainFirstW(({ admins, myUid }) =>
      throwIfNotAdmin('Я не админ, дай админку')(admins, myUid),
    ),
    // read target uid
    RTE.bindW('targetUid', () => RTE.fromReaderEither(readTargetUid())),
    // throw if not admin
    RTE.chainFirstW(({ admins, targetUid }) =>
      throwIfNotAdmin('Цель не админ, нужен промоут')(admins, targetUid),
    ),
    // read command text
    RTE.bindW('commandText', () => readCommandText()),
    // rename target
    RTE.chainFirstW(({ targetUid, commandText }) => rename(targetUid, commandText)),
  );

export const create = (token: string) => {
  const bot = new Bot(token);
  bot.command('start', (ctx) => ctx.reply('Прив!'));
  bot.command('promote', (ctx) => pipe(promoteHandler(), runHandler(ctx)));
  bot.command('demote', (ctx) => pipe(demoteHandler(), runHandler(ctx)));
  bot.command('rename', (ctx) => pipe(renameHandler(), runHandler(ctx)));
  return bot;
};

export const start = <C extends Context, A extends Api, B extends Bot<C, A>>(
  bot: B,
): TE.TaskEither<Error, void> => TE.tryCatch(() => bot.start(), E.toError);

// const textMessageHandler = (ctx: Filter<Context, 'message:text'>) => {};
// bot.on('message:text', textMessageHandler);
