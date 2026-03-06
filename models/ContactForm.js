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
            firstName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'first_name',
            },
            lastName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'last_name',
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
