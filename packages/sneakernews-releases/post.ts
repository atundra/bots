import * as O from 'fp-ts/lib/Option';
import * as EQ from 'fp-ts/lib/Eq';
import { getIntercalateSemigroup, semigroupString } from 'fp-ts/lib/Semigroup';
import { showNumber } from 'fp-ts/lib/Show';
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { pipe, identity } from 'fp-ts/lib/function';

export type PostData = {
  name: string;
  price: string;
  url: string;
  dateString: string;
  img: O.Option<string>;
};

// Do you know what overengineering is?
const ddmm = (d: Date): string =>
  getIntercalateSemigroup('.')(semigroupString).concat(
    showNumber.show(d.getDate()).padStart(2, '0'),
    showNumber.show(d.getMonth()).padStart(2, '0')
  );

export const isReleasedAt = (d: Date) => (p: PostData): boolean =>
  EQ.eqString.equals(p.dateString, ddmm(d));

const joinNewline = getIntercalateSemigroup('\n')(semigroupString);

const tgShowPost = ({ url, name, price }: PostData): string =>
  `${url ? `[${name}](${url})` : name}${price ? ` – ${price}` : ''}`;

export const tgShowPosts = (ps: RNEA.ReadonlyNonEmptyArray<PostData>): string =>
  pipe(ps, RNEA.map(tgShowPost), RNEA.foldMap(joinNewline)(identity));
