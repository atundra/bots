require('dotenv').config();
const Sequelize = require('sequelize');
const sequelize = new Sequelize(`postgres://${process.env.DB_PATH}`);


module.exports = {
  sequelize,

  async sync() {
    return sequelize.sync();
  },
};
