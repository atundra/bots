import { CronJob } from 'cron';
import * as IO from 'fp-ts/lib/IO';
import { Task } from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe, flow } from 'fp-ts/lib/function';
// @ts-ignore
import work from './work';
// @ts-ignore
import { get as getUsers } from './user';
// @ts-ignore
import log from './log';

const getNowDate: IO.IO<Date> = () => new Date();

export const runCron = flow(getNowDate, (now: Date) => {
  const nowHour = now.getUTCHours();
  const nowMinute = now.getUTCMinutes();
  const currentSecond = (nowHour * 60 + nowMinute) * 60;

  // return getUsers({ where: { sendWhen: currentSecond } });
});

const cronJob = () => {
  const now = new Date();
  const nowHour = now.getUTCHours();
  const nowMinute = now.getUTCMinutes();
  const currentSecond = (nowHour * 60 + nowMinute) * 60;
  const users = getUsers({ where: { sendWhen: currentSecond } });
  return users.then((users: any) => Promise.all(users.map(work)));
};

// const runCron: IO<void> = () => {
//   new CronJob(
//     '0 0 * * * *',
//     () => {
//       cronJob()
//         .then(() => log('Cron job completed'))
//         .catch(err => console.error(err));
//     },
//     null,
//     true,
//     'Europe/Moscow'
//   );
// };

export default runCron;
