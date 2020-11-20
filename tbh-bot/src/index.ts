import express from 'express';
import * as H from 'hyper-ts';
import * as O from 'fp-ts/lib/Option';
import { toRequestHandler, fromRequestHandler } from 'hyper-ts/lib/express';
import { lit, end, Parser, Route } from 'fp-ts-routing';
import { right, left } from 'fp-ts/lib/Either';
import { identity, pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as Console from 'fp-ts/lib/Console';
import { Telegram } from 'telegraf';
import * as t from 'io-ts';

import { getConfig } from './utils/config';
import { startTunnel } from './utils/dev';
import { createTelegram, setWebhook, sendMessage } from './telegram';
import { Message } from 'telegraf/typings/telegram-types';

type Location = { type: 'Bot' };

const botLocation: Location = { type: 'Bot' };

function fromParser<E, A extends Record<string, unknown>>(
  parser: Parser<A>,
  error: E
): H.Middleware<H.StatusOpen, H.StatusOpen, E, A> {
  return H.fromConnection(c =>
    pipe(
      parser.run(Route.parse(c.getOriginalUrl())),
      O.map(([a]) => right<E, A>(a)),
      O.getOrElse(() => left(error))
    )
  );
}

const notFound = () =>
  pipe(
    H.status(H.Status.NotFound),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.end())
  );

const POST: H.Middleware<H.StatusOpen, H.StatusOpen, string, 'POST'> = H.decodeMethod(s =>
  s.toLowerCase() === 'post' ? right('POST') : left('Incorrect verb')
);

const json = express.json();

const jsonMiddleware = fromRequestHandler(json, () => undefined);

const Chat = t.type({
  id: t.number
});

const Message = t.type({
  message_id: t.number,
  text: t.string,
  chat: Chat
});

const Update = t.partial({
  message: Message
});

const updateBodyDecoder = pipe(
  jsonMiddleware,
  H.chain(() => POST),
  H.chain(() =>
    H.decodeBody(u =>
      pipe(
        Update.decode(u),
        E.mapLeft(() => 'Unsupported update type')
      )
    )
  )
);

const createBotMiddleware = (telegram: Telegram) =>
  pipe(
    POST,
    H.chain(() => updateBodyDecoder),
    H.chainFirst(update => {
      if (update.message?.text) {
        return H.fromTaskEither(sendMessage(telegram, update.message.chat.id, update.message.text));
      }

      return H.iof(null);
    }),
    H.ichain(() => H.status(H.Status.OK)),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.end())
  );

const createAppMiddleware = (
  routingMiddleware: H.Middleware<H.StatusOpen, H.StatusOpen, string, Location>,
  telegram: Telegram
) =>
  pipe(
    routingMiddleware,
    H.ichain(route => {
      switch (route.type) {
        case 'Bot':
          return createBotMiddleware(telegram);
      }
    }),
    H.orElse(notFound)
  );

const addMiddleware = <I, O, E>(
  express: express.Express,
  middleware: H.Middleware<I, O, E, void>
) => express.use(toRequestHandler(middleware));

const createBotRoute = (token: string) => lit(token).then(end);

const listen = (
  express: express.Express,
  port: string | number
): TE.TaskEither<unknown, express.Express> =>
  TE.tryCatch(
    () =>
      new Promise(resolve => {
        express.listen(port, () => resolve(express));
      }),
    identity
  );

pipe(
  getConfig(process.env),
  TE.fromEither,
  TE.chain(config => {
    if (config.DEV) {
      return pipe(
        startTunnel(Number(config.PORT)),
        TE.map(tunnel => ({
          ...config,
          HOSTNAME: tunnel.url
        })),
        TE.chainFirst(config =>
          TE.fromIO<unknown, void>(Console.log(`Localtunnel url is ${config.HOSTNAME}`))
        )
      );
    }

    return TE.of(config);
  }),
  TE.chain(config => {
    const botRoute = createBotRoute(config.BOT_TOKEN);

    const router: Parser<Location> = botRoute.parser.map<Location>(() => botLocation);

    const routingMiddleware = fromParser(router, 'not found');
    const telegram = createTelegram(config.BOT_TOKEN);

    const appMiddleware = createAppMiddleware(routingMiddleware, telegram);

    const app = express();

    addMiddleware(app, appMiddleware);

    return pipe(
      listen(app, config.PORT),
      TE.map(() => ({ telegram, config }))
    );
  }),
  TE.chain(({ telegram, config }) =>
    setWebhook(telegram, `${config.HOSTNAME}/${config.BOT_TOKEN}`)
  ),
  TE.fold(
    e => T.fromIO(Console.error(e)),
    () => T.of(undefined)
  )
)();
