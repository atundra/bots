const Sequelize = require('sequelize');
const { sequelize } = require('./db');

const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;
const DEFAULT_SEND_WHEN = (DEFAULT_HOUR * 60 + DEFAULT_MINUTE) * 60;

const User = sequelize.define('User', {
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
const getSendTime = (hour, minute, timezone) => {
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

module.exports = {
  async register(id, lang = null) {
    return User.findCreateFind({
      where: { id },
      defaults: { lang },
    });
  },

  async setTime(id, subscriptionHour = 7, subscriptionMinute = 0) {
    const user = await User.findOne({ where: { id } });
    const update = {
      subscriptionHour,
      subscriptionMinute,
    };

    if (user.timezone) {
      update.sendWhen = getSendTime(
        subscriptionHour,
        subscriptionMinute,
        user.timezone
      );
    }

    return User.update(update, {
      where: { id },
    });
  },

  async get(condition) {
    return User.findAll(condition);
  },

  async getById(id) {
    return User.findOne({ where: { id } });
  },

  async setTimezone(id, timezone) {
    const user = await User.findOne({ where: { id } });
    const update = {
      timezone,
    };

    if (user.subscriptionHour && user.subscriptionMinute) {
      user.sendWhen = getSendTime(
        user.subscriptionHour,
        user.subscriptionMinute,
        timezone
      );
    }

    return User.update(update, {
      where: { id },
    });
  },
};
