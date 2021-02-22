import * as IO from 'fp-ts/lib/IO';
import * as D from 'fp-ts/lib/Date';
import * as E from 'fp-ts/lib/Either';
import * as M from 'fp-ts/lib/Monoid';
import * as C from 'fp-ts/lib/Console';
import * as S from 'fp-ts/lib/Semigroup';
import { pipe } from 'fp-ts/lib/pipeable';
import { Composer, Middleware } from 'telegraf';
import formatISO from 'date-fns/fp/formatISO';
import { constant, flow } from 'fp-ts/lib/function';
import { Show } from 'fp-ts/lib/Show';
import * as RT from 'fp-ts/lib/ReaderTask';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as T from 'fp-ts/lib/Task';
import { TelegrafContext } from 'telegraf/typings/context';
import { sequenceT } from 'fp-ts/lib/Apply';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { locale } from './_locale';

const object = {
  show: (object: unknown) => JSON.stringify(object, undefined, 2),
};

// Semigroup log string: concats strings using \t symbol
const SLS = pipe(S.semigroupString, S.getIntercalateSemigroup('\t'));

const showObject = (object: unknown) => JSON.stringify(object, undefined, 2);

const createLogString = (s: string): IO.IO<string> =>
  pipe(
    D.create,
    IO.map(formatISO),
    IO.map((date) => SLS.concat(date, s))
  );

const log = (s: string) => pipe(s, createLogString, IO.chain(C.log));

type MiddlewareContext = { ctx: TelegrafContext; next: T.Task<void> };

const middlewareFromRT = (
  a: RT.ReaderTask<MiddlewareContext, unknown>
): Middleware<TelegrafContext> => (ctx, next) => RT.run(a, { ctx, next });

const taskSeqT = sequenceT(T.taskSeq);

const logTask = <T>(ctxPart: T, next: T.Task<void>) =>
  pipe(
    ctxPart,
    showObject,
    log,
    T.fromIO,
    T.chain(() => next)
  );

const anyAction = () =>
  Composer.action(
    /.*/,
    middlewareFromRT(({ ctx: { update }, next }) => logTask(update, next))
  );

const anyMessage = () =>
  Composer.mount(
    'message',
    middlewareFromRT(({ ctx: { message }, next }) => logTask(message, next))
  );

type TError = {
  response: string;
  log: Error;
};

const TError = (response: string, log: Error): TError => ({
  response,
  log,
});

type Locale = typeof locale;

const constructMiddleware = () => {};

const setTimeAction = (locale: Locale) =>
  Composer.action(
    /settime([0-2][0-9])00/,
    middlewareFromRT(
      pipe(
        RT.asks(({ ctx: { from } }: MiddlewareContext) => from),
        RTE.rightReaderTask,
        // locale is unknown at this moment so we'll use defaule one
        RTE.chainEitherK(
          E.fromNullable(
            TError(
              locale.genericError(),
              new Error('Set time action middleware, context.from is empty')
            )
          )
        ),
        RTE.map((u) => u.language_code)
        // RTE.chain(lang => (ctx) => )
        // RTE.chainTaskEitherK((tgUser) =>
        //   pipe(
        //     registerUser(tgUser.id, tgUser.language_code),
        //     TE.map(([dbUser, created]) => ({ dbUser, created, tgUser })),
        //     TE.mapLeft<unknown, string>((err) =>
        //       locale.genericError(tgUser.language_code)
        //     )
        //   )
        // )
      )

      // const [, timestring] = ctx.match!;
      // try {
      //   await userSetTime(ctx.from.id, parseInt(timestring, 10));
      // } catch (err) {
      //   log('ERROR', 'userSetTime', timestring);
      // }

      // const message = locale.timeUpdated(ctx.from.language_code, {
      //   RECEIVING_TIME: `${timestring}:00`,
      // });
      // await ctx.answerCbQuery(message);
      // await ctx.deleteMessage();
      // return ctx.reply(message);
    )
  );

const getMws = (): ReadonlyArray<Middleware<TelegrafContext>> => [
  anyAction(),
  // setTimeAction(),
  // getTimeZoneFromTime(),
  // get(),
  // setUTCCommon(),
  // setTime(),
  // setTimezoneFromTime(),
  // setTimezone(),
  // setUTC(),
  // location(),
  // message(),
  // start(),
  anyMessage(),
];

export const botMiddleware = (): MiddlewareFn<TelegrafContext> =>
  pipe(getMws(), Composer.compose);
