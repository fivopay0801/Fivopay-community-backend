'use strict';

module.exports = (sequelize, DataTypes) => {
    const ContactForm = sequelize.define(
        'ContactForm',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            fullName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'full_name',
            },
            orgName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'org_name',
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: false,
                field: 'phone',
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    isEmail: true,
                },
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            tableName: 'contact_forms',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return ContactForm;
};
