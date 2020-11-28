import { pipe } from 'fp-ts/lib/function';
import * as RT from 'fp-ts/lib/ReaderTask';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as Console from 'fp-ts/lib/Console';
import Telegraf, { Telegram } from 'telegraf';

import { getPopulatedConfig } from './utils/config';
import { setWebhook, startWebhook, getMe } from './telegram';
import { newChatMembersHandler } from './telegram/handlers';
import { getMiddleware } from './telegram';

const app = pipe(
  getPopulatedConfig,
  RTE.chainW(config => {
    return pipe(
      getMe(new Telegram(config.BOT_TOKEN)),
      RTE.fromTaskEither,
      RTE.chain(user => {
        const telegraf = new Telegraf(config.BOT_TOKEN, {
          username: user.username
        });

        telegraf.on('new_chat_members', getMiddleware(newChatMembersHandler));

        return pipe(
          RTE.fromIO(startWebhook(telegraf, `/${config.BOT_TOKEN}`, Number(config.PORT))),
          RTE.map(() => ({ telegraf, config }))
        );
      })
    );
  }),
  RTE.chain(({ telegraf, config }) =>
    RTE.fromTaskEither(setWebhook(telegraf.telegram, `${config.HOSTNAME}/${config.BOT_TOKEN}`))
  ),
  RTE.fold(RT.fromIOK(Console.error), () => RT.of(undefined))
);

app(process.env)();
