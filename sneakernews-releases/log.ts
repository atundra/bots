import * as IO from 'fp-ts/lib/IO';

const log = (...messages: unknown[]): IO.IO<void> => () =>
  console.log(new Date().toISOString(), ...messages);

export default log;
