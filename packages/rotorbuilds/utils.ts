import * as O from 'fp-ts/lib/Option';

export type ArrayOf2PlusN<A> = [A, A, ...A[]];

export const ArrayOf2PlusN = <A>(xs: A[]): O.Option<ArrayOf2PlusN<A>> =>
  xs.length > 2 ? O.some(xs as ArrayOf2PlusN<A>) : O.none;

export const mapArrayOf2PlusN =
  <A, B>(f: (a: A, i: number) => B) =>
  (xs: ArrayOf2PlusN<A>): ArrayOf2PlusN<B> =>
    xs.map(f) as ArrayOf2PlusN<B>;
