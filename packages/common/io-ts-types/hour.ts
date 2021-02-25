import * as t from 'io-ts';

interface Bounded023Brand {
  readonly Bounded023: unique symbol;
}

type Bounded023 = t.Branded<number, Bounded023Brand>;

interface Bounded023C extends t.Type<Bounded023, number, unknown> {}

/**
 * A codec that succeeds if a number is 0-23
 */
const Bounded023: Bounded023C = t.brand(
  t.number,
  (n): n is Bounded023 => n >= 0 && n <= 23,
  'Bounded023'
);

export const Hour = t.intersection([t.Int, Bounded023]);
