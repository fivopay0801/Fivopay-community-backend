'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('devotees', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            mobile: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            profile_image: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            otp_hash: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            otp_expires_at: {
                type: Sequelize.DATE,
                allowNull: true
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

        await queryInterface.addIndex('devotees', ['mobile']);
        await queryInterface.addIndex('devotees', ['email']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('devotees');
    }
};
