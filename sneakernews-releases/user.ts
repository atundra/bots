import Sequelize from 'sequelize';
import { sequelize } from './db';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';

const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;
const DEFAULT_SEND_WHEN = (DEFAULT_HOUR * 60 + DEFAULT_MINUTE) * 60;

export type User = {
  id: number;
  subscriptionHour: number;
  subscriptionMinute: number;
  lang?: string | null;
  timezone?: number | null;
  sendWhen: number;
};

type UserAttributes = {
  id: number;
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

export const register = (id: number, lang = null) => {
  return User.findCreateFind<{}>({
    where: { id },
    defaults: { lang } as UserCreationAttributes,
  });
};

export const setTime = async (
  id: number,
  subscriptionHour = 7,
  subscriptionMinute = 0
) => {
  const user = await User.findOne({ where: { id } });
  const update: Partial<UserAttributes> = {
    subscriptionHour,
    subscriptionMinute,
  };

  if (user && user.timezone) {
    update.sendWhen = getSendTime(
      subscriptionHour,
      subscriptionMinute,
      user.timezone
    );
  }

  return User.update(update, {
    where: { id },
  });
};

export const get = (
  condition: Sequelize.FindOptions<UserAttributes>
): TE.TaskEither<Error, User[]> => {
  return TE.tryCatch(() => User.findAll(condition), E.toError);
};

export const getById = (id: number) => {
  return User.findOne({ where: { id } });
};

export const setTimezone = async (id: number, timezone: number) => {
  const user = await User.findOne({ where: { id } });
  const update = {
    timezone,
  };

  if (user && user.subscriptionHour && user.subscriptionMinute) {
    user.sendWhen = getSendTime(
      user.subscriptionHour,
      user.subscriptionMinute,
      timezone
    );
  }

  return User.update(update, {
    where: { id },
  });
};
