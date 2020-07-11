require('dotenv').config();
const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  dialect: 'postgresql',
});

module.exports = {
  sequelize,

  async sync() {
    return sequelize.sync();
  },
};
