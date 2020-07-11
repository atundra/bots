import { config } from 'dotenv';
import * as E from 'fp-ts/lib/Either';
import * as RR from 'fp-ts/lib/ReadonlyRecord';
import { pipe, flow, identity } from 'fp-ts/lib/function';
import { sequenceS } from 'fp-ts/lib/Apply';
config();

const getFromEnvStrict = (key: string) => (env: NodeJS.ProcessEnv) =>
  pipe(
    process.env[key],
    E.fromNullable(new Error('No BOT_TOKEN process env specified'))
  );

const seqSEither = sequenceS(E.either);

export const getConfig = (env: NodeJS.ProcessEnv) =>
  pipe(
    {
      BOT_TOKEN: getFromEnvStrict('BOT_TOKEN'),
      DB_NAME: getFromEnvStrict('DB_NAME'),
      GOOGLE_TIMEZONE_API_KEY: getFromEnvStrict('GOOGLE_TIMEZONE_API_KEY'),
    },
    RR.map((a) => a(env)),
    seqSEither
  );

export const getConfigUnsafe = flow(
  getConfig,
  E.fold((e) => {
    throw e;
  }, identity)
);
