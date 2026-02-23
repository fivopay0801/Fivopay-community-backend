'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('support_tickets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            admin_name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            admin_email: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            status: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'pending'
            },
            admin_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            devotee_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'devotees',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('support_tickets', ['admin_id']);
        await queryInterface.addIndex('support_tickets', ['devotee_id']);
        await queryInterface.addIndex('support_tickets', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('support_tickets');
    }
};
