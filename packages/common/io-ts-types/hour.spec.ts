import * as fc from 'fast-check';
import { Hour } from './hour';
import * as E from 'fp-ts/lib/Either';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as EQ from 'fp-ts/lib/Eq';

test('should decode ints from 0 to 23', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 23 }), (data) => {
      // Since encode-decode-is methods are relate to each other we'll test only decode
      expect(Hour.decode(data)).toStrictEqual(E.right(data));
    })
  );
});

const possibleInts = RA.range(0, 23);

test('should not decode any number except ints from 0 to 23', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.double({ next: true }).filter((a) => !RA.elem(EQ.eqNumber)(a)(possibleInts)),
        fc.integer().filter((a) => !RA.elem(EQ.eqNumber)(a)(possibleInts))
      ),
      (data) => {
        expect(E.isLeft(Hour.decode(data))).toBe(true);
      }
    )
  );
});
