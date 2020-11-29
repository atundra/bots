import * as E from 'fp-ts/lib/Either';
import * as RR from 'fp-ts/lib/ReadonlyRecord';
import * as RE from 'fp-ts/lib/ReaderEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as O from 'fp-ts/lib/Option';
import { pipe, flow } from 'fp-ts/lib/function';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as Console from 'fp-ts/lib/Console';

import { startTunnel, TunnelError } from '../utils/dev';

const isString = (a: unknown): a is string => typeof a === 'string';

class EnvNotSpecifiedError extends Error {
  constructor(public readonly envKey: string) {
    super(`No ${envKey} process env speciified`);
  }
}

const fromEnvStrict = (
  key: string
): RE.ReaderEither<NodeJS.ProcessEnv, EnvNotSpecifiedError, string> =>
  flow(
    RR.lookup(key),
    O.filter(isString),
    E.fromOption(() => new EnvNotSpecifiedError(key))
  );

const fromEnvOptional = (
  key: string
): RE.ReaderEither<NodeJS.ProcessEnv, never, string | undefined> =>
  flow(RR.lookup(key), O.toUndefined, E.right);

export const getConfig = pipe(
  {
    BOT_TOKEN: fromEnvStrict('BOT_TOKEN'),
    HOSTNAME: fromEnvStrict('HOSTNAME'),
    PORT: fromEnvStrict('PORT'),
    DEV: fromEnvOptional('DEV')
  },
  sequenceS(RE.readerEither)
);

type Config = typeof getConfig extends RE.ReaderEither<any, any, infer A> ? A : never;

export const getPopulatedConfig = pipe(
  getConfig,
  RTE.fromReaderEither,
  RTE.chainW(config =>
    pipe(
      O.fromNullable(config.DEV),
      O.fold(
        () => RTE.of<NodeJS.ProcessEnv, TunnelError, Config>(config),
        () =>
          pipe(
            startTunnel(Number(config.PORT)),
            RTE.fromTaskEither,
            RTE.map(tunnel => ({
              ...config,
              HOSTNAME: tunnel.url
            })),
            RTE.chainFirst(config =>
              RTE.fromIO(Console.log(`Localtunnel url is ${config.HOSTNAME}`))
            )
          )
      )
    )
  )
);
