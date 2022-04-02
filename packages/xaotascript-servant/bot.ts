import { Api, Bot, Context, Filter, NextFunction } from 'grammy';
import { constFalse, pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as B from 'fp-ts/boolean';
import * as D from 'fp-ts/Date';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as string from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import { EnvType, query, RTEfromReaderOption } from './utils';
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
  readChatId,
  removeMessage,
  replyText,
} from './api';
import { SupabaseClient } from '@supabase/supabase-js';
import { SKTCache } from './cache';

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

const dateToDayNameValue = (d: Date): DayNameValue => {
  switch (d.getUTCDay()) {
    case 0:
      return 'sunday';
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
      return 'friday';
    case 6:
      return 'saturday';

    default:
      throw new Error('Panic: unexpected getUTCDay value');
  }
};

const strictEq =
  (a: unknown) =>
  (b: unknown): boolean =>
    a === b;

const textMessageHandler =
  (vmoCache: SKTCache<E.Either<string, O.Option<DayNameValue>>>) =>
  (ctx: Filter<Context, 'message:text'>, next: NextFunction) => {
    return pipe(
      RTE.Do,
      RTE.bindW('chatId', () =>
        pipe(RTEfromReaderOption(() => 'Не могу определить в каком чате я нахожусь')(readChatId())),
      ),
      RTE.bind('now', () => RTE.fromIO(D.create)),
      RTE.bindW('chatVMO', ({ chatId }) => RTE.fromTaskEither(vmoCache.get(chatId.toString(10)))),
      RTE.bindW('vmoEnabled', ({ now, chatVMO }) =>
        pipe(chatVMO, O.match(constFalse, strictEq(dateToDayNameValue(now))), RTE.of),
      ),
      RTE.chainFirstW(({ vmoEnabled }) =>
        vmoEnabled
          ? pipe(
              removeMessage(),
              RTE.chainW(() => replyText(`День кружечків, текстовые сообщения запрещены!`)),
            )
          : RTE.fromIO(() => {
              next();
            }),
      ),
    )({ context: ctx })();
  };

type DayNameValue =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

const dayNameValues: DayNameValue[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const parseDayName = (s: string): O.Option<DayNameValue> => {
  const value = s.toLowerCase();
  switch (value) {
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
    case 'saturday':
    case 'sunday':
      return O.some(value);
    default:
      return O.none;
  }
};

const isDayNameValue = (s: string): s is DayNameValue => O.isSome(parseDayName(s));

const readNonEmptyCommandValue = () =>
  pipe(
    readCommandText(),
    RTE.filterOrElseW(
      (s) => !string.isEmpty(s),
      () => 'Please provide a value',
    ),
  );

const invalidateVMOCacheRecord =
  (chatId: string): RTE.ReaderTaskEither<{ VMOService: SKTCache<unknown> }, string, void> =>
  ({ VMOService }) =>
    TE.fromIO(VMOService.invalidate(chatId));

const enableVideoMessageOnlyHandler = () =>
  pipe(
    RTE.Do,
    RTE.bind('dayNameValue', () =>
      pipe(
        readNonEmptyCommandValue(),
        RTE.filterOrElseW(
          isDayNameValue,
          (value) =>
            `${value} is not a valid value. Try one of the following values: ${dayNameValues.join(
              ', ',
            )}.`,
        ),
        RTE.map((a) => a.toLowerCase()),
      ),
    ),
    RTE.bindW('chatId', () =>
      pipe(RTEfromReaderOption(() => 'Не могу определить в каком чате я нахожусь')(readChatId())),
    ),
    RTE.bind('now', () => RTE.fromIO(D.create)),
    RTE.chainFirstW(({ dayNameValue, chatId, now }) =>
      pipe(
        query('videoOnlyModeEnabled', (qb) =>
          qb.upsert({
            chat_id: chatId.toString(10),
            enabled_at_day: dayNameValue,
            updated_at: now.toISOString(),
          }),
        ),
        RTE.mapLeft((err) => `Попытка записи в базу завершилась ошибкой ${err.error.message}`),
      ),
    ),
    RTE.chainFirstW(({ chatId }) => invalidateVMOCacheRecord(chatId.toString(10))),
  );

const disableVideoMessageOnlyHandler = () =>
  pipe(
    RTE.Do,
    RTE.bindW('chatId', () =>
      pipe(RTEfromReaderOption(() => 'Не могу определить в каком чате я нахожусь')(readChatId())),
    ),
    RTE.bind('now', () => RTE.fromIO(D.create)),
    RTE.chainFirstW(({ chatId, now }) =>
      pipe(
        query('videoOnlyModeEnabled', (qb) =>
          qb.upsert({
            chat_id: chatId.toString(10),
            enabled_at_day: 'disabled',
            updated_at: now.toISOString(),
          }),
        ),
        RTE.mapLeft((err) => `Попытка записи в базу завершилась ошибкой ${err.error.message}`),
      ),
    ),
    RTE.chainFirstW(({ chatId }) => invalidateVMOCacheRecord(chatId.toString(10))),
  );

export const create = (token: string, supabase: SupabaseClient) => {
  const bot = new Bot(token);

  const VMOService = SKTCache.create(
    (chatId: string) =>
      pipe(
        query('videoOnlyModeEnabled', (qb) => qb.select('*').eq('chat_id', chatId))({
          client: supabase,
        }),
        TE.bimap(
          (err) => `Ошибка с доступом к джойказино: ${err.error.message}`,
          (res) =>
            pipe(
              res.data,
              RA.head,
              O.chainNullableK((a) => a.enabled_at_day),
              O.filter(isDayNameValue),
            ),
        ),
      ),
    1000 * 60 * 5,
  );

  bot.command('start', (ctx) => ctx.reply('Прив!'));
  bot.command('promote', (context) => pipe(promoteHandler(), runHandler({ context })));
  bot.command('demote', (context) => pipe(demoteHandler(), runHandler({ context })));
  bot.command('rename', (context) => pipe(renameHandler(), runHandler({ context })));

  bot.command('enable_vmo', (context) =>
    pipe(enableVideoMessageOnlyHandler(), runHandler({ context, client: supabase, VMOService })),
  );
  bot.command('disable_vmo', (context) =>
    pipe(
      disableVideoMessageOnlyHandler(),
      runHandler({ context, client: supabase, VMOService }, 'Убрал'),
    ),
  );

  bot.on('message:text', textMessageHandler(VMOService));

  return bot;
};

export const start = <C extends Context, A extends Api, B extends Bot<C, A>>(
  bot: B,
): TE.TaskEither<Error, never> => TE.tryCatch(() => bot.start() as Promise<never>, E.toError);
