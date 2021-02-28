import * as fc from 'fast-check';
import { isReleasedAt, PostData } from './post';
import * as O from 'fp-ts/lib/Option';

test('returns true when dates are the same day and same month', () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.date(),
      (name, price, url, date) => {
        const postData: PostData = {
          name,
          price,
          url,
          dateString: `${date
            .getDate()
            .toString()
            .padStart(2, '0')}.${date.getMonth().toString().padStart(2, '0')}`,
          img: O.none,
        };
        expect(isReleasedAt(date)(postData)).toBe(true);
      }
    )
  );
});
