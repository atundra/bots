import { pipe } from 'fp-ts/function';
import * as D from 'fp-ts/Date';
import * as T from 'fp-ts/Task';
import * as O from 'fp-ts/Option';
import * as Tuple from 'fp-ts/Tuple';
import * as IO from 'fp-ts/IO';

type CacheRecord<A> = [value: A, storedAt: Date];

const storedAt = <A>(cr: CacheRecord<A>): Date => Tuple.snd(cr);

const value = <A>(cr: CacheRecord<A>): A => Tuple.fst(cr);

/**
 * Returns true if first date is after the second
 */
const isAfter = (d1: Date, d2: Date): boolean => d1.getTime() > d2.getTime();

const isBefore = (d1: Date, d2: Date): boolean => d1.getTime() < d2.getTime();

const addMs = (d: Date, ms: number): Date => new Date(d.getTime() + ms);

/**
 * String Key Task Cache
 */
export class SKTCache<A> {
  private readonly map: Map<string, CacheRecord<A>> = new Map();

  private constructor(
    private readonly lookup: (k: string) => T.Task<A>,
    private readonly ttl: number, // private readonly capacity: number,
  ) {}

  get(k: string): T.Task<A> {
    return pipe(
      T.Do,
      T.bind('now', () => T.fromIO(D.create)),
      T.bind('cachedRecord', () => T.fromIO(() => O.fromNullable(this.map.get(k)))),
      T.bind('cachedValue', ({ now, cachedRecord }) =>
        pipe(
          O.Do,
          O.bind('record', () => cachedRecord),
          O.bind('storedAt', ({ record }) => O.of(storedAt(record))),
          O.bind('expireAt', ({ storedAt }) => O.of(addMs(storedAt, this.ttl))),
          O.filter(({ expireAt }) => isAfter(expireAt, now)),
          O.map(({ record }) => value(record)),
          T.of,
        ),
      ),
      T.map(({ cachedValue }) => cachedValue),
      T.chain(
        O.fold(
          () =>
            pipe(
              T.Do,
              T.bind('value', () => this.lookup(k)),
              T.bind('storedAt', () => T.fromIO(D.create)),
              T.chainFirstIOK(
                ({ value, storedAt }) =>
                  () =>
                    this.map.set(k, [value, storedAt]),
              ),
              T.map(({ value }) => value),
            ),
          T.of,
        ),
      ),
    );
  }

  invalidate(k: string): IO.IO<void> {
    return () => {
      this.map.delete(k);
    };
  }

  // def cacheStats: UIO[CacheStats]
  // def contains(key: Key): UIO[Boolean]
  // def entryStats(key: Key): UIO[Option[EntryStats]]
  // def invalidateAll: UIO[Unit]
  // def refresh(key: Key): IO[Error, Unit]
  // def size: UIO[Int]

  static create<A>(
    lookup: (k: string) => T.Task<A>,
    ttl: number = Infinity,
    // capacity: number = Infinity,
  ) {
    return new SKTCache(lookup, ttl /* capacity */);
  }
}
