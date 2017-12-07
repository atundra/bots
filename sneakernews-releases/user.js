const Sequelize = require('sequelize');
const {sequelize} = require('./db');


const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;

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
    type: Sequelize.STRING,
  },
});

module.exports = {
  async register(id, lang = null) {
    return User.findCreateFind({
      where: {id},
      defaults: {lang},
    });
  },

  async setTime(id, subscriptionHour = 7, subscriptionMinute = 0) {
    return User.update({
      subscriptionHour,
      subscriptionMinute,
    }, {
      where: {id},
    });
  },

  async get(condition) {
    return User.findAll(condition);
  },

  async getById(id) {
    return User.findOne({where: {id}});
  },

  async setTimezone(id, timezone) {
    return User.update({
      timezone,
    }, {
      where: {id},
    });
  }
};
