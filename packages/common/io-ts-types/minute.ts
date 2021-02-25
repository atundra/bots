import * as t from 'io-ts';

interface Bounded059Brand {
  readonly Bounded059: unique symbol;
}

type Bounded059 = t.Branded<number, Bounded059Brand>;

interface Bounded059C extends t.Type<Bounded059, number, unknown> {}

/**
 * A codec that succeeds if a number is 0-59 int
 */
const Bounded059: Bounded059C = t.brand(
  t.number,
  (n): n is Bounded059 => n >= 0 && n <= 59,
  'Bounded059'
);

export const Minute = t.intersection([t.Int, Bounded059]);
