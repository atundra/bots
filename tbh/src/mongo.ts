import {
  Collection,
  CollectionInsertManyOptions,
  CommonOptions,
  Db as MongoDb,
  FilterQuery,
  FindOneOptions,
  MongoClient,
  MongoError,
  OptionalId
} from 'mongodb';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { Branded } from 'io-ts';
import { pipe } from 'fp-ts/lib/pipeable';

declare const clientStateConnected: unique symbol;
type ClientStateConnected = typeof clientStateConnected;
declare const clientStateDisconnected: unique symbol;
type ClientStateDisconnected = typeof clientStateDisconnected;

type ClientState = ClientStateConnected | ClientStateDisconnected;

declare const clientStateBrand: unique symbol;
declare const clientDataSchemaBrand: unique symbol;

/* eslint-disable @typescript-eslint/ban-types */
type UnknownDataScheme = {};

type Client<D extends UnknownDataScheme, S extends ClientState> = MongoClient & {
  [clientStateBrand]: S;
  [clientDataSchemaBrand]: D;
};

export type _ConnectedMongoClient<D extends UnknownDataScheme> = Client<D, ClientStateConnected>;
type _DisconnectedMongoClient<D extends UnknownDataScheme> = Client<D, ClientStateDisconnected>;

export type ConnectedMongoClient = Branded<MongoClient, 'connected'>;

declare const dbNameBrand: unique symbol;
declare const dbCollectionsBrand: unique symbol;

type Db<Collections> = MongoDb & {
  [dbCollectionsBrand]: Collections;
};

export const client = <D extends UnknownDataScheme>(uri: string) =>
  new MongoClient(uri, {
    useNewUrlParser: true,
    connectTimeoutMS: 1000 * 10,
    useUnifiedTopology: true
  }) as _DisconnectedMongoClient<D>;

export const connect = <D extends UnknownDataScheme>(
  client: _DisconnectedMongoClient<D>
): TE.TaskEither<MongoError, _ConnectedMongoClient<D>> =>
  TE.tryCatch(
    () => client.connect() as Promise<_ConnectedMongoClient<D>>,
    err => err as MongoError
  );

export const db = <D extends UnknownDataScheme, N extends keyof D & string>(name: N) => (
  client: _ConnectedMongoClient<D>
) => client.db(name) as Db<D[N]>;

export const collection = <Cs extends {}, N extends keyof Cs & string>(name: N) => (db: Db<Cs>) =>
  db.collection<Cs[N]>(name);

export const close = <D extends UnknownDataScheme>(
  client: _ConnectedMongoClient<D>
): TE.TaskEither<MongoError, void> =>
  TE.tryCatch(
    () => client.close(),
    err => err as MongoError
  );

export const useMongo = (uri: string) => <A>(
  use: <D extends UnknownDataScheme>(a: _ConnectedMongoClient<D>) => TE.TaskEither<Error, A>
): TE.TaskEither<Error, A> => TE.bracket(pipe(uri, client, connect), use, client => close(client));

interface Find {
  <A>(q: A): <C>(
    c: Collection<A extends FilterQuery<C> ? C : never>
  ) => TE.TaskEither<MongoError, C[]>;
  <A, B>(q: A, o: B): <C>(
    c: Collection<
      A extends FilterQuery<C>
        ? B extends FindOneOptions<C extends C ? C : never>
          ? C
          : B extends void
          ? C
          : never
        : never
    >
  ) => TE.TaskEither<MongoError, C[]>;
}

const f: Find = <AA, A extends FilterQuery<AA>>(q: A) => <C>(c: Collection<C>) =>
  TE.tryCatch(
    () => c.find(q).toArray(),
    err => err as MongoError
  );
declare const d: Collection<{ a: 1 }>;

const x = pipe(d, f({}));

export const find = <A, B>(q: A, o?: B) => <C>(c: Collection<>): TE.TaskEither<MongoError, C[]> =>
  TE.tryCatch(
    () => c.find(q, o).toArray(),
    err => err as MongoError
  );

export const insertMany = <A>(
  ds: RNEA.ReadonlyNonEmptyArray<OptionalId<A>>,
  o?: CollectionInsertManyOptions
) => (c: Collection<A>) =>
  TE.tryCatch(
    () => c.insertMany(RA.toArray(ds), o),
    err => err as MongoError
  );

export const deleteMany = <A>(q: FilterQuery<A>, o?: CommonOptions) => (c: Collection<A>) =>
  TE.tryCatch(
    () => c.deleteMany(q, o),
    err => err as MongoError
  );
