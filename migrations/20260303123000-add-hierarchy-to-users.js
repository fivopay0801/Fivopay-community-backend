'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'organization_category', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'faith', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'organization_subtype', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'organization_category');
        await queryInterface.removeColumn('users', 'faith');
        await queryInterface.removeColumn('users', 'organization_subtype');
    },
};
