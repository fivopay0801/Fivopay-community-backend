'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('devotee_favorites', {
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
            display_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
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

        await queryInterface.addIndex('devotee_favorites', ['devotee_id', 'admin_id'], { unique: true });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('devotee_favorites');
    }
};
