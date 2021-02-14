import { CronJob } from 'cron';
import * as IO from 'fp-ts/lib/IO';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { flow, pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';

import work from './work';
import { get as getUsers, User } from './user';
import log, { error } from './log';

const getNowDate: IO.IO<Date> = () => new Date();
const getUsersByDate: (date: Date) => TE.TaskEither<Error, User[]> = (date) => {
  const nowHour = date.getUTCHours();
  const nowMinute = date.getUTCMinutes();
  const currentSecond = (nowHour * 60 + nowMinute) * 60;

  return getUsers({ where: { sendWhen: currentSecond } });
};

const workWrapper = (user: User) => TE.tryCatch(() => work(user), E.toError);

export const cronJob = pipe(
  T.fromIO(getNowDate),
  T.chain(getUsersByDate),
  TE.chain(flow(A.map(workWrapper), A.sequence(TE.taskEither)))
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
