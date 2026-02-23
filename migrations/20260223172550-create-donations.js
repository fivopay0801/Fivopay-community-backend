'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('donations', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            devotee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'devotees',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            event_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'events',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            razorpay_order_id: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            razorpay_payment_id: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            razorpay_signature: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            utr: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            transaction_id: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'pending'
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

        await queryInterface.addIndex('donations', ['devotee_id']);
        await queryInterface.addIndex('donations', ['admin_id']);
        await queryInterface.addIndex('donations', ['event_id']);
        await queryInterface.addIndex('donations', ['razorpay_order_id']);
        await queryInterface.addIndex('donations', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('donations');
    }
};
