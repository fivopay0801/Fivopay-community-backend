'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'otp_hash', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'otp_expires_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'last_otp_sent_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'otp_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
        await queryInterface.addColumn('users', 'otp_window_start_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'otp_hash');
        await queryInterface.removeColumn('users', 'otp_expires_at');
        await queryInterface.removeColumn('users', 'last_otp_sent_at');
        await queryInterface.removeColumn('users', 'otp_count');
        await queryInterface.removeColumn('users', 'otp_window_start_at');
    }
};
