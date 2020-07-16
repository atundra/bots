import { config } from 'dotenv';
import * as E from 'fp-ts/lib/Either';
import * as RR from 'fp-ts/lib/ReadonlyRecord';
import * as RE from 'fp-ts/lib/ReaderEither';
import * as O from 'fp-ts/lib/Option';
import { pipe, flow, identity } from 'fp-ts/lib/function';
import { sequenceS } from 'fp-ts/lib/Apply';
config();

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

const fromConst = <T>(val: T): RE.ReaderEither<unknown, never, T> => () =>
  E.right(val);

export const getConfig = pipe(
  {
    BOT_TOKEN: fromEnvStrict('BOT_TOKEN'),
    DB_NAME: fromEnvStrict('DB_NAME'),
    GOOGLE_TIMEZONE_API_KEY: fromEnvStrict('GOOGLE_TIMEZONE_API_KEY'),
  },
  sequenceS(RE.readerEither)
);

export const getConfigUnsafe = flow(
  getConfig,
  E.fold((e) => {
    throw e;
  }, identity)
);
