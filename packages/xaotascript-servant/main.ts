import { identity, pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { EnvType, orThrow, readAppSetting } from './utils';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from './config';
import { create, start } from './bot';

const createRuntimeConfig = (env: EnvType, supabase: SupabaseClient) => ({
  read(key: string): TE.TaskEither<Error, O.Option<string>> {
    return readAppSetting(key)({ env, supabase });
  },

  readRequired(key: string): TE.TaskEither<Error, string> {
    return pipe(
      readAppSetting(key),
      RTE.chainOptionK(
        () =>
          new Error(
            `${key} value is empty in a runtime config table, please add row with key ${key} and corresponding value`,
          ),
      )(identity),
    )({ env, supabase });
  },
});

const mainTask = pipe(
  TE.Do,
  TE.bind('processEnv', () => TE.fromIO(() => process.env)),
  TE.bindW('config', ({ processEnv }) => TE.fromEither(getConfig(processEnv))),
  TE.bindW('supabase', ({ config }) =>
    TE.of(createClient(config.SUPABASE_URL, config.SUPABASE_KEY)),
  ),
  TE.bindW('runtimeConfig', ({ config, supabase }) =>
    TE.of(createRuntimeConfig(config.ENV, supabase)),
  ),
  TE.bindW('botToken', ({ runtimeConfig }) => runtimeConfig.readRequired('BOT_TOKEN')),

  TE.bindW('bot', ({ botToken, supabase }) => pipe(create(botToken, supabase), start)),
);

mainTask().then(orThrow).catch(console.error);
