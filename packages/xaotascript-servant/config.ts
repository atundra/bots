import * as E from 'fp-ts/Either';
import * as RR from 'fp-ts/ReadonlyRecord';
import * as RE from 'fp-ts/ReaderEither';
import * as O from 'fp-ts/Option';
import { pipe, flow } from 'fp-ts/function';
import { sequenceS } from 'fp-ts/Apply';
import { EnvType } from './utils';

const isString = (a: unknown): a is string => typeof a === 'string';

declare global {
  interface ErrorConstructor<T extends string = string> extends Error<T> {}

  interface Error<T extends string = string> {
    readonly tag: T;
    new <T extends string>(message?: string): Error<T>;
  }
}

class EnvNotSpecifiedError extends Error<'EnvNotSpecifiedError'> {
  public readonly tag = 'EnvNotSpecifiedError';

  constructor(public readonly envKey: string) {
    super(`No ${envKey} process env specified`);
  }
}

class EnvIncorrectValueError extends Error<'EnvIncorrectValueError'> {
  public readonly tag = 'EnvIncorrectValueError';

  constructor(
    public readonly envKey: string,
    public readonly value: string,
    public readonly validValues: string[],
  ) {
    super(
      `Env variable ${envKey} is set up to ${value} but this value isn't supported. Try one of those: ${validValues.join(
        ', ',
      )}.`,
    );
  }
}

const fromEnvStrict = (
  key: string,
): RE.ReaderEither<NodeJS.ProcessEnv, EnvNotSpecifiedError, string> =>
  flow(
    RR.lookup(key),
    O.filter(isString),
    E.fromOption(() => new EnvNotSpecifiedError(key)),
  );

type Literal = string | number | boolean | null;

const fromLiteral =
  <T extends readonly [Literal]>(...val: T): RE.ReaderEither<unknown, never, T[0]> =>
  () =>
    E.right(val[0]);

const fromEnvOneOfLiteral = <A extends string>(
  key: string,
  values: A[],
): RE.ReaderEither<NodeJS.ProcessEnv, EnvNotSpecifiedError | EnvIncorrectValueError, A> =>
  pipe(
    fromEnvStrict(key),
    RE.filterOrElseW(
      (value): value is A => {
        for (const v of values) {
          if (v === value) {
            return true;
          }
        }
        return false;
      },
      (value) => new EnvIncorrectValueError(key, value, values),
    ),
  );

export const getConfig = pipe(
  {
    ENV: fromEnvOneOfLiteral<EnvType>('ENV', ['production', 'development']),
    SUPABASE_KEY: fromEnvStrict('SUPABASE_KEY'),
    SUPABASE_URL: fromLiteral('https://dkcmgdwxlfowikrnxleg.supabase.co'),
  },
  sequenceS(RE.Apply),
);
