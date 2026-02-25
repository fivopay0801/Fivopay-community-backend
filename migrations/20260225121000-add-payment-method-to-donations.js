'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('donations', 'payment_method', {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Payment method used (e.g., upi, card, netbanking, wallet, cash)',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('donations', 'payment_method');
    },
};
