'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Create sequence starting at 1111
            await queryInterface.sequelize.query('CREATE SEQUENCE IF NOT EXISTS org_id_seq START WITH 1111', { transaction });

            // Add org_id column as nullable initially
            await queryInterface.addColumn('users', 'org_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                unique: true
            }, { transaction });

            // Populate existing records with IDs from the sequence
            await queryInterface.sequelize.query("UPDATE users SET org_id = nextval('org_id_seq') WHERE org_id IS NULL", { transaction });

            // Set default value for future inserts
            await queryInterface.sequelize.query("ALTER TABLE users ALTER COLUMN org_id SET DEFAULT nextval('org_id_seq')", { transaction });

            // Make it NOT NULL for future data integrity
            await queryInterface.changeColumn('users', 'org_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true
            }, { transaction });

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'org_id');
        await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS org_id_seq');
    }
};
