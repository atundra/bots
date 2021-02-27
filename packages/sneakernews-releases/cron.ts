import { CronJob } from 'cron';
import * as IO from 'fp-ts/lib/IO';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { flip, flow, pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as D from 'fp-ts/lib/Date';
import * as WRTE from 'fp-ts/lib/StateReaderTaskEither';
import work from './work';
// import { get as getUsers, User } from './user';
import log, { error } from './log';
import * as C from 'fp-ts/lib/Console';
import * as O from 'fp-ts/lib/Option';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray';
import * as MN from '@atundra/common/mongo';
import { User } from './__user';

const workWrapper = (user: User) => TE.tryCatch(() => work(user), E.toError);

const createDate = TE.fromIO<never, Date>(D.create);

const teLog = (s: string): TE.TaskEither<never, void> =>
  TE.fromIO<never, void>(
    pipe(
      D.create,
      IO.chain((d) => C.log(`${d.toISOString()}\t${s}`))
    )
  );

// Function rounds seconds down to HH:00:00 or HH:30:00
const getSecondsFromDayStart = (d: Date): number =>
  (d.getUTCHours() * 60 + (d.getUTCMinutes() > 29 ? 30 : 0)) * 60;

type MongoSchema = { sneakernewsReleases: { users: User } };

export const cronJob = pipe(
  TE.Do,
  TE.chainFirst(() => teLog('Starting cron job')),

  // Read config from env
  TE.bind('config', () =>
    TE.of({
      MONGO_URI: 'mogouriexample',
      MONGO_DB_NAME: 'sneakernewsReleases',
    } as const)
  ),

  // Calculate seconds from date starts (not really, @see getSecondsFromDayStart)
  TE.bind('secondsFromDayStart', () =>
    pipe(TE.fromIO<never, Date>(D.create), TE.map(getSecondsFromDayStart))
  ),
  TE.chainFirst(({ secondsFromDayStart }) =>
    teLog(`Seconds from day start: ${secondsFromDayStart}`)
  ),

  // Now load users who subscribed to notifications at this hour
  TE.bind('users', ({ config, secondsFromDayStart }) =>
    pipe(
      config.MONGO_URI,
      MN.flippedUseMongo((client: MN._ConnectedMongoClient<MongoSchema>) =>
        pipe(
          client,
          MN.db(config.MONGO_DB_NAME),
          MN.collection('users'),
          MN.find<User>({ sendWhen: secondsFromDayStart })
        )
      )
    )
  ),

  // Refine users to be non empty list
  TE.chainW((a) =>
    pipe(
      a.users,
      RNEA.fromArray,
      O.fold(
        () => teLog('No user subscribed to recieve notifications now'),
        (users) =>
          pipe(
            TE.right({ ...a, users }),
            TE.chain(({ users }) => teLog(`${users.length} users found`))
            // Now parse posts
          )
      )
    )
  )

  // TE.chain(TE.traverseArray(workWrapper)),
);

const runCron: IO.IO<void> = () => {
  new CronJob(
    '0 0 * * * *',
    pipe(
      cronJob,
      TE.fold(flow(error, T.fromIO), () => T.fromIO(log('Cron job completed')))
    ),
    null,
    true,
    'Europe/Moscow'
  );
};

export default runCron;
