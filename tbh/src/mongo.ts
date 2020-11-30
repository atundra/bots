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

type NonConnectedMongoClient = Branded<MongoClient, 'nonconnected'>;
export type ConnectedMongoClient = Branded<MongoClient, 'connected'>;

declare const dbNameBrand: unique symbol;
declare const dbCollectionsBrand: unique symbol;

type Db<Name, Collections> = MongoDb & {
  [dbNameBrand]: Name;
  [dbCollectionsBrand]: Collections;
};

export const client = (uri: string) =>
  new MongoClient(uri, {
    useNewUrlParser: true,
    connectTimeoutMS: 1000 * 10,
    useUnifiedTopology: true
  }) as NonConnectedMongoClient;

export const connect = (
  client: NonConnectedMongoClient
): TE.TaskEither<MongoError, ConnectedMongoClient> =>
  TE.tryCatch(
    () => client.connect() as Promise<ConnectedMongoClient>,
    err => err as MongoError
  );

export const db = <N extends string, Cs>(name: N) => (client: ConnectedMongoClient) =>
  client.db(name) as Db<N, Cs>;

type CollectionSchema<Cs, N extends keyof Cs> = Cs[N];

export const collection = <Cs, CollectionName extends keyof Cs & string>(name: CollectionName) => <
  DbName
>(
  db: Db<DbName, Cs>
) => db.collection<CollectionSchema<Cs, CollectionName>>(name);

export const close = (client: ConnectedMongoClient): TE.TaskEither<MongoError, void> =>
  TE.tryCatch(
    () => client.close(),
    err => err as MongoError
  );

export const useMongo = (uri: string) => <A>(
  use: (a: ConnectedMongoClient) => TE.TaskEither<Error, A>
): TE.TaskEither<Error, A> => TE.bracket(pipe(uri, client, connect), use, client => close(client));

export const find = <A>(q: FilterQuery<A>, o?: FindOneOptions<A extends A ? A : A>) => (
  c: Collection<A>
): TE.TaskEither<MongoError, A[]> =>
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

// declare const mc: ConnectedMongoClient;
// pipe(mc, db<'asdf', { aaa: { s: string } }>('asdf'), collection('aaa'), find({}));
