import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import { TelegrafContext } from 'telegraf/typings/context';

export const newChatMembersHandler = pipe(
  RTE.ask<TelegrafContext>(),
  RTE.chain(ctx =>
    pipe(
      O.fromNullable(ctx.message),
      O.chain(message => O.fromNullable(message.new_chat_members)),
      RTE.fromOption(() => new Error('Chat members not found')),
      RTE.chain(users => RTE.of(users))
    )
  )
);
