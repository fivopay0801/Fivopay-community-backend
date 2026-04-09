'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('devotees');

    if (!cols.pan_number) {
      await queryInterface.addColumn('devotees', 'pan_number', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!cols.pan_card_image) {
      await queryInterface.addColumn('devotees', 'pan_card_image', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const cols = await queryInterface.describeTable('devotees');
    if (cols.pan_card_image) {
      await queryInterface.removeColumn('devotees', 'pan_card_image');
    }
    if (cols.pan_number) {
      await queryInterface.removeColumn('devotees', 'pan_number');
    }
  },
};

