import * as C from 'fp-ts/lib/Console';
import { Middleware } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { pipe, constVoid, identity, flow } from 'fp-ts/lib/function';
import * as D from 'fp-ts/lib/Date';
import * as IO from 'fp-ts/lib/IO';
import * as T from 'fp-ts/lib/Task';
import formatISO from 'date-fns/fp/formatISO';
import { sequenceT } from 'fp-ts/lib/Apply';
import * as RT from 'fp-ts/lib/ReaderTask';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { locale } from './_locale';
import { Command } from './_command';
import { Message } from 'telegraf/typings/telegram-types';

const showObject = (object: object) => JSON.stringify(object);

const logObject = (data: object) =>
  pipe(
    D.create,
    IO.map(formatISO),
    IO.map(
      (dateString) => `${dateString}\tAction recieved\t${showObject(data)}`
    ),
    IO.chain(C.log)
  );

type MiddlewareContext = { ctx: TelegrafContext; next: T.Task<void> };

const getMiddleware = (
  a: RT.ReaderTask<MiddlewareContext, unknown>
): Middleware<TelegrafContext> => (ctx, next) => RT.run(a, { ctx, next });

const taskSeqT = sequenceT(T.taskSeq);

export const actionHandler = getMiddleware(({ ctx, next }) =>
  taskSeqT(pipe(ctx.update, logObject, T.fromIO), next)
);

export const messageHandler = getMiddleware(({ ctx, next }) =>
  taskSeqT(
    pipe(
      ctx.message,
      O.fromNullable,
      O.fold(() => constVoid, logObject),
      T.fromIO
    ),
    next
  )
);

declare const registerUser: (
  id: number,
  lang?: string
) => TE.TaskEither<unknown, [unknown, boolean]>;

const replyString = (
  str: string
): RT.ReaderTask<MiddlewareContext, Message> => ({ ctx: { reply } }) => () =>
  reply(str);

export const startHandler = getMiddleware(
  pipe(
    RT.ask<MiddlewareContext>(),
    RT.map(({ ctx: { from } }) => from),
    RTE.rightReaderTask,
    // locale is unknown at this moment so we'll use defaule one
    RTE.chainEitherK(E.fromNullable(locale.genericError())),
    RTE.chainTaskEitherK(({ id, language_code }) =>
      pipe(
        registerUser(id, language_code),
        TE.mapLeft<unknown, string>((err) =>
          locale.genericError(language_code)
        ),
        TE.filterOrElse<string, [unknown, boolean]>(
          ([_, created]) => created,
          () =>
            locale.alreadyRegistered(language_code, {
              SET_TIME_COMMAND: Command.SET_TIME,
            })
        ),
        TE.map(() =>
          locale.welcome(language_code, {
            SET_TIME_COMMAND: Command.SET_TIME,
          })
        )
      )
    ),
    RTE.fold(replyString, replyString)
  )
);
