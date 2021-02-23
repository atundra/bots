import Sequelize from 'sequelize';
import { sequelize } from './db';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { unsafeCoerce } from 'fp-ts/lib/function';

const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;
const DEFAULT_SEND_WHEN = (DEFAULT_HOUR * 60 + DEFAULT_MINUTE) * 60;

type Id = number;

export type User = {
  id: Id;
  subscriptionHour: number;
  subscriptionMinute: number;
  lang?: string | null;
  timezone?: number | null;
  sendWhen: number;
};

type UserAttributes = {
  id: Id;
  subscriptionHour: number | null;
  subscriptionMinute: number | null;
  lang: string | null;
  timezone: number | null;
  sendWhen: number | null;
};

type UserCreationAttributes = Partial<UserAttributes> & { id: number };

const User: Sequelize.Model<
  User,
  UserCreationAttributes,
  UserAttributes
> = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  subscriptionHour: {
    type: Sequelize.INTEGER,
    defaultValue: DEFAULT_HOUR,
  },
  subscriptionMinute: {
    type: Sequelize.INTEGER,
    defaultValue: DEFAULT_MINUTE,
  },
  lang: {
    type: Sequelize.STRING,
  },
  timezone: {
    type: Sequelize.INTEGER,
  },
  sendWhen: {
    type: Sequelize.INTEGER,
    defaultValue: DEFAULT_SEND_WHEN,
  },
});

const DAY_IN_SECONDS = 24 * 60 * 60;

/** @return {number} seconds */
const getSendTime = (hour: number, minute: number, timezone: number) => {
  const time = (hour * 60 + minute) * 60;
  const sendWhenRaw = time - timezone;

  if (sendWhenRaw > DAY_IN_SECONDS) {
    return sendWhenRaw - DAY_IN_SECONDS;
  }

  if (sendWhenRaw < 0) {
    return sendWhenRaw + DAY_IN_SECONDS;
  }

  return sendWhenRaw;
};

type Time = {
  hour: number;
  minute: number;
};

const findById = (id: Id): TE.TaskEither<Error, O.Option<User>> =>
  pipe(
    TE.tryCatch(() => User.findOne({ where: { id } }), E.toError),
    TE.map(O.fromNullable)
  );

const update = (id: Id) => <U>(update: U) =>
  TE.tryCatch(() => User.update(update, { where: { id } }), E.toError);

const getTimezoneUpdate = (time: O.Option<Time>) => (
  user: O.Option<User>
): {
  subscriptionHour: number;
  subscriptionMinute: number;
  sendWhen?: number;
} =>
  pipe(
    time,
    O.getOrElse(() => ({
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
    })),
    ({ hour, minute }) =>
      Object.assign(
        {
          subscriptionHour: hour,
          subscriptionMinute: minute,
        },
        pipe(
          user,
          O.map((u) => u.timezone),
          O.chain(O.fromNullable),
          O.fold<number, { sendWhen?: number }>(
            () => ({}),
            (tz) => ({
              sendWhen: getSendTime(hour, minute, tz),
            })
          )
        )
      )
  );

export const setTime = (id: number) => (
  time: O.Option<Time>
): TE.TaskEither<Error, [number, User[]]> =>
  pipe(id, findById, TE.map(getTimezoneUpdate(time)), TE.chain(update(id)));
