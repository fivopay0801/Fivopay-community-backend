'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Add receipt_number to donations
    const donationCols = await queryInterface.describeTable('donations');
    if (!donationCols.receipt_number) {
      await queryInterface.addColumn('donations', 'receipt_number', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }

    // Enforce per-organization uniqueness for receipt numbers
    try {
      await queryInterface.addIndex('donations', ['admin_id', 'receipt_number'], {
        unique: true,
        name: 'donations_admin_receipt_number_unique',
      });
    } catch (e) {
      // ignore if index already exists
    }

    // 2) Create receipt_counters table
    const tables = await queryInterface.showAllTables();
    const hasReceiptCounters = tables.map(String).includes('receipt_counters');
    if (!hasReceiptCounters) {
      await queryInterface.createTable('receipt_counters', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        admin_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        last_number: {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      });

      await queryInterface.addIndex('receipt_counters', ['admin_id'], {
        unique: true,
        name: 'receipt_counters_admin_id_unique',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('donations', 'donations_admin_receipt_number_unique');
    } catch (e) {
      // ignore
    }

    const donationCols = await queryInterface.describeTable('donations');
    if (donationCols.receipt_number) {
      await queryInterface.removeColumn('donations', 'receipt_number');
    }

    const tables = await queryInterface.showAllTables();
    const hasReceiptCounters = tables.map(String).includes('receipt_counters');
    if (hasReceiptCounters) {
      await queryInterface.dropTable('receipt_counters');
    }
  },
};

