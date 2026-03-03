'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('devotees', 'last_otp_sent_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('devotees', 'otp_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
        await queryInterface.addColumn('devotees', 'otp_window_start_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('devotees', 'last_otp_sent_at');
        await queryInterface.removeColumn('devotees', 'otp_count');
        await queryInterface.removeColumn('devotees', 'otp_window_start_at');
    }
};
