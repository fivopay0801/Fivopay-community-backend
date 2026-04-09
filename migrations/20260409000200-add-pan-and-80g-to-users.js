'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('users');

    if (!cols.pan_number) {
      await queryInterface.addColumn('users', 'pan_number', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!cols.registration_80g_number) {
      await queryInterface.addColumn('users', 'registration_80g_number', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('users');
    if (cols.pan_number) {
      await queryInterface.removeColumn('users', 'pan_number');
    }
    if (cols.registration_80g_number) {
      await queryInterface.removeColumn('users', 'registration_80g_number');
    }
  },
};

