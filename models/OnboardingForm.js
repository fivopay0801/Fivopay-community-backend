'use strict';

module.exports = (sequelize, DataTypes) => {
    const OnboardingForm = sequelize.define(
        'OnboardingForm',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            institutionName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'institution_name',
            },
            registrationNumber: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'registration_number',
            },
            panNumber: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: 'pan_number',
            },
            institutionAddress: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'institution_address',
            },
            institutionEmail: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'institution_email',
            },
            institutionPhone: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'institution_phone',
            },
            // Section 2: Bank Details
            accountHolderName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'account_holder_name',
            },
            bankName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'bank_name',
            },
            branchName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'branch_name',
            },
            accountNumber: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'account_number',
            },
            ifscCode: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'ifsc_code',
            },
            // Section 3: Authorized Signatory Details
            signatoryName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'signatory_name',
            },
            designation: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'designation',
            },
            idProofType: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'id_proof_type',
            },
            idProofNumber: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'id_proof_number',
            },
            signatoryMobile: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'signatory_mobile',
            },
            signatoryEmail: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'signatory_email',
            },
            aadharNumber: {
                type: DataTypes.STRING(20),
                allowNull: true,
                field: 'aadhar_number',
            },
            // Section 4: Document URLs
            registrationCertificateUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'registration_certificate_url',
            },
            panCardUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'pan_card_url',
            },
            addressProofUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'address_proof_url',
            },
            idProofUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'id_proof_url',
            },
            aadharCardUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'aadhar_card_url',
            },
            bankProofUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'bank_proof_url',
            },
            // Section 5: Collection Purpose
            purposeReligious: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'purpose_religious',
            },
            purposeCommunity: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'purpose_community',
            },
            purposeEducational: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'purpose_educational',
            },
            purposeInfrastructure: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'purpose_infrastructure',
            },
            purposeOther: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'purpose_other',
            },
            // Section 6: Declarations
            isLawfullyEstablished: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_lawfully_established',
            },
            isInformationTrue: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_information_true',
            },
            isBankAccountOwned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_bank_account_owned',
            },
            isFundsForLawfulPurposes: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_funds_for_lawful_purposes',
            },
        },
        {
            tableName: 'onboarding_forms',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    OnboardingForm.associate = (models) => {
        OnboardingForm.belongsTo(models.User, {
            foreignKey: 'adminId',
            as: 'admin',
        });
    };

    return OnboardingForm;
};
