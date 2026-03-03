'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('onboarding_forms', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            admin_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            // Section 1: Institution Details
            institution_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            registration_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            pan_number: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            institution_address: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            institution_email: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            institution_phone: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            // Section 2: Bank Details
            account_holder_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            bank_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            branch_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            account_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            ifsc_code: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            // Section 3: Authorized Signatory Details
            signatory_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            designation: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            id_proof_type: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            id_proof_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            signatory_mobile: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            signatory_email: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            // Section 4: Document URLs
            registration_certificate_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            pan_card_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            address_proof_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            id_proof_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            bank_proof_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            // Section 5: Collection Purpose
            purpose_religious: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            purpose_community: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            purpose_educational: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            purpose_infrastructure: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            purpose_other: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            // Section 6: Declarations
            is_lawfully_established: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            is_information_true: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            is_bank_account_owned: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            is_funds_for_lawful_purposes: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('onboarding_forms');
    }
};
