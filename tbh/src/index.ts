import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as RT from 'fp-ts/lib/ReaderTask';
import * as Console from 'fp-ts/lib/Console';
import * as O from 'fp-ts/lib/Option';
import Telegraf, { Middleware } from 'telegraf';

import { getConfig } from './utils/config';
import { startTunnel } from './utils/dev';
import { setWebhook, startWebhook, reply } from './telegram';
import { TelegrafContext } from 'telegraf/typings/context';

const getMiddleware = (
  a: RT.ReaderTask<TelegrafContext, unknown>
): Middleware<TelegrafContext> => ctx => RT.run(a, ctx);

const echoHandler = getMiddleware(
  pipe(
    RTE.ask<TelegrafContext>(),
    RTE.chain(ctx =>
      pipe(
        O.fromNullable(ctx.message),
        O.chain(message => O.fromNullable(message.text)),
        RTE.fromOption(() => new Error('Message text not found')),
        RTE.chain(text => RTE.fromTaskEither(reply(ctx, text)))
      )
    )
  )
);

const app = pipe(
  getConfig(process.env),
  TE.fromEither,
  TE.chain(config =>
    pipe(
      O.fromNullable(config.DEV),
      O.fold(
        () => TE.of(config),
        () =>
          pipe(
            startTunnel(Number(config.PORT)),
            TE.map(tunnel => ({
              ...config,
              HOSTNAME: tunnel.url
            })),
            TE.chainFirst(config =>
              TE.fromIO<unknown, void>(Console.log(`Localtunnel url is ${config.HOSTNAME}`))
            )
          )
      )
    )
  ),
  TE.chain(config => {
    const telegraf = new Telegraf(config.BOT_TOKEN);

    telegraf.on('text', echoHandler);

    return pipe(
      TE.fromIO(startWebhook(telegraf, `/${config.BOT_TOKEN}`, Number(config.PORT))),
      TE.map(() => ({ telegraf, config }))
    );
  }),
  TE.chain(({ telegraf, config }) =>
    setWebhook(telegraf.telegram, `${config.HOSTNAME}/${config.BOT_TOKEN}`)
  ),
  TE.fold(T.fromIOK(Console.error), () => T.of(undefined))
);

app();
