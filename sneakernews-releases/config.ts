import { config } from 'dotenv';
import * as E from 'fp-ts/lib/Either';
import * as RR from 'fp-ts/lib/ReadonlyRecord';
import * as RE from 'fp-ts/lib/ReaderEither';
import * as O from 'fp-ts/lib/Option';
import { pipe, flow, identity } from 'fp-ts/lib/function';
config();

const isString = (a: unknown): a is string => typeof a === 'string';

class EnvNotSpecifiedError extends Error {
  constructor(public readonly envKey: string) {
    super(`No ${envKey} process env speciified`);
  }
}

const getFromEnvStrict = (
  key: string
): RE.ReaderEither<NodeJS.ProcessEnv, EnvNotSpecifiedError, string> =>
  flow(
    RR.lookup(key),
    O.filter(isString),
    E.fromOption(() => new EnvNotSpecifiedError(key))
  );

export const getConfig = pipe(
  {
    BOT_TOKEN: getFromEnvStrict('BOT_TOKEN'),
    DB_NAME: getFromEnvStrict('DB_NAME'),
    GOOGLE_TIMEZONE_API_KEY: getFromEnvStrict('GOOGLE_TIMEZONE_API_KEY'),
  },
  RR.sequence(RE.readerEither)
);

export const getConfigUnsafe = flow(
  getConfig,
  E.fold((e) => {
    throw e;
  }, identity)
);
