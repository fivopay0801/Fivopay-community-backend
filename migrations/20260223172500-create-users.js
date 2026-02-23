'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            password_hash: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            address: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            profile_image: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            role: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'admin'
            },
            organization_type: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            created_by_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
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

        await queryInterface.addIndex('users', ['email']);
        await queryInterface.addIndex('users', ['role']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('users');
    }
};
