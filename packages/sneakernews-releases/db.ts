require('dotenv').config();
import Sequelize from 'sequelize';

export const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  dialect: 'postgresql',
});

export const sync = () => sequelize.sync();
