import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { TelegrafContext } from 'telegraf/typings/context';

export const newChatMembersHandler = pipe(
  RTE.ask<TelegrafContext>(),
  RTE.chainEitherK(ctx =>
    pipe(
      ctx.message,
      O.fromNullable,
      O.chainNullableK(m => m.new_chat_members),
      E.fromOption(() => new Error('Chat members not found'))
    )
  ),
  RTE.chain(users => RTE.of(users))
);
