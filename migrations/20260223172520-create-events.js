'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('events', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
            event_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'general'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            event_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            start_time: {
                type: Sequelize.STRING(10),
                allowNull: true
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            end_time: {
                type: Sequelize.STRING(10),
                allowNull: true
            },
            location: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            image_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            target_amount_paise: {
                type: Sequelize.BIGINT,
                allowNull: true
            },
            raised_amount_paise: {
                type: Sequelize.BIGINT,
                allowNull: false,
                defaultValue: 0
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
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

        await queryInterface.addIndex('events', ['admin_id']);
        await queryInterface.addIndex('events', ['event_date']);
        await queryInterface.addIndex('events', ['event_type']);
        await queryInterface.addIndex('events', ['admin_id', 'event_date']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('events');
    }
};
