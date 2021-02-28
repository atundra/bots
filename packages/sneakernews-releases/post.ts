import * as O from 'fp-ts/lib/Option';
import * as EQ from 'fp-ts/lib/Eq';
import { getIntercalateSemigroup, semigroupString } from 'fp-ts/lib/Semigroup';
import { showNumber } from 'fp-ts/lib/Show';

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

// static overall(posts: Post[]) {
//   if (posts.length === 0) {
//     return null;
//   }

//   return posts
//     .map((post) => {
//       const { name, price, url } = post;

//       return `${url ? `[${name}](${url})` : name}${
//         price ? ` – ${price}` : ''
//       }`;
//     })
//     .join('\n');
// }
