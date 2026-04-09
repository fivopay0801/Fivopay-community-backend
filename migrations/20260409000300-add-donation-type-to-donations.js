'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('donations');
    if (!cols.donation_type) {
      await queryInterface.addColumn('donations', 'donation_type', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'donation',
      });
      await queryInterface.addIndex('donations', ['donation_type']);
    }
  },

  async down(queryInterface) {
    const cols = await queryInterface.describeTable('donations');
    if (cols.donation_type) {
      try {
        await queryInterface.removeIndex('donations', ['donation_type']);
      } catch (e) {
        // ignore
      }
      await queryInterface.removeColumn('donations', 'donation_type');
    }
  },
};

