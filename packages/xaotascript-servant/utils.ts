import * as O from 'fp-ts/Option';
import { identity, Lazy, pipe } from 'fp-ts/function';
import * as R from 'fp-ts/Reader';
import * as RE from 'fp-ts/ReaderEither';
import * as RTE from 'fp-ts/ReaderTaskEither';

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
