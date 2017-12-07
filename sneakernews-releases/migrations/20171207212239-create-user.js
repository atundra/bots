'use strict';
const DEFAULT_HOUR = 7;
const DEFAULT_MINUTE = 0;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};