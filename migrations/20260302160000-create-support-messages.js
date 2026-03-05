'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.showAllTables();
    const tableExists = tableInfo.includes('support_messages');

    if (!tableExists) {
      await queryInterface.createTable('support_messages', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        support_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'support_tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        sender_role: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        sender_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }

    try {
      await queryInterface.addIndex('support_messages', ['support_id']);
    } catch (e) {}
    try {
      await queryInterface.addIndex('support_messages', ['sender_role']);
    } catch (e) {}
    try {
      await queryInterface.addIndex('support_messages', ['sender_id']);
    } catch (e) {}
    try {
      await queryInterface.addIndex('support_messages', ['is_read']);
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('support_messages');
  },
};

