import * as O from 'fp-ts/Option';
import { flow, identity, Lazy, pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as R from 'fp-ts/Reader';
import * as RE from 'fp-ts/ReaderEither';
import * as Rec from 'fp-ts/Record';
import * as RA from 'fp-ts/ReadonlyArray';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { PostgrestError, PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';
import { definitions } from './supabase/database';
import { last } from 'fp-ts/lib/Semigroup';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';

export const readNonEmptyStringFromEnv =
  (key: string): IOE.IOEither<Error, string> =>
  () => {
    const value = process.env[key];
    if (value === undefined) {
      return E.left(
        new Error(`Key ${key} isn't presented in application env. Try to run app with ${key}=...`),
      );
    }

    if (value === '') {
      return E.left(
        new Error(
          `Key ${key} is presented in application env but contains an empty string. Try to provide a value for ${key}.`,
        ),
      );
    }

    return E.right(value);
  };

export const readEnvVar =
  (key: string): IO.IO<O.Option<string>> =>
  () =>
    O.fromNullable(process.env[key]);

export const readEnvTypeFromEnv = (key: string): IO.IO<EnvType> =>
  pipe(
    readEnvVar(key),
    IO.map(O.filter(isEnvType)),
    IO.map(O.getOrElse<EnvType>(() => 'development')),
  );

export type EnvType = 'production' | 'development';

const isEnvType = (s: string): s is EnvType => s === 'development' || s === 'production';

interface PostgrestResponseBase {
  status: number;
  statusText: string;
}

interface PostgrestResponseSuccess<T> extends PostgrestResponseBase {
  error: null;
  data: T[];
  body: T[];
  count: number | null;
}
interface PostgrestResponseFailure extends PostgrestResponseBase {
  error: PostgrestError;
  data: null;
  // For backward compatibility: body === data
  body: null;
  count: null;
}

const isPostgrestResponseFailure = <A>(
  response: PostgrestResponse<A>,
): response is PostgrestResponseFailure => response.error !== null;

export const query =
  <A extends keyof definitions>(
    table: A,
    buildQuery: (
      pqb: PostgrestQueryBuilder<definitions[A]>,
    ) => PostgrestFilterBuilder<definitions[A]>,
  ): RTE.ReaderTaskEither<
    { client: SupabaseClient },
    PostgrestResponseFailure,
    PostgrestResponseSuccess<definitions[A]>
  > =>
  ({ client }) =>
  async () => {
    const response = await buildQuery(client.from<definitions[A]>(table));
    return isPostgrestResponseFailure(response) ? E.left(response) : E.right(response);
  };

type ReadAppSettingsCtx = { env: EnvType; supabase: SupabaseClient };

export const readAppSettings: RTE.ReaderTaskEither<
  ReadAppSettingsCtx,
  Error,
  Record<string, string>
> = pipe(
  RTE.asks<ReadAppSettingsCtx, EnvType>(({ env }) => env),
  RTE.chain((env) =>
    pipe(
      query('config', (table) => table.select('key, value').eq('env', env)),
      RTE.local(({ supabase }) => ({ client: supabase })),
    ),
  ),
  RTE.bimap(
    ({ error }) => new Error(`Failed to read app setings from db: ${error.message}`),
    (response) =>
      pipe(
        response.data,
        A.map(({ key, value }) => [key, value] as [string, string]),
        Rec.fromFoldable(last<string>(), A.Foldable),
      ),
  ),
);

export const readAppSetting = (
  key: string,
): RTE.ReaderTaskEither<ReadAppSettingsCtx, Error, O.Option<string>> =>
  pipe(
    RTE.asks<ReadAppSettingsCtx, EnvType>(({ env }) => env),
    RTE.chain((env) =>
      pipe(
        query('config', (table) => table.select('key, value').eq('env', env).eq('key', key)),
        RTE.map(({ data }) =>
          pipe(
            data,
            RA.head,
            O.map(({ value }) => value),
          ),
        ),
        RTE.local(({ supabase }) => ({ client: supabase })),
      ),
    ),
    RTE.mapLeft(({ error }) => new Error(`Failed to read app setings from db: ${error.message}`)),
  );

export type Uid = number;

export const RTEfromReaderOption =
  <E>(onNone: Lazy<E>) =>
  <C, A>(ro: R.Reader<C, O.Option<A>>): RTE.ReaderTaskEither<C, E, A> =>
    pipe(
      RE.fromReader<C, O.Option<A>, E>(ro),
      RE.chainOptionK(onNone)(identity),
      RTE.fromReaderEither,
    );

export const readErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const orThrow: <A, B>(a: E.Either<A, B>) => B = flow(
  E.fold((e) => {
    throw e;
  }, identity),
);
