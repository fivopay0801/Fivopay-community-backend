'use strict';

const { SUPPORT_STATUS } = require('../constants/support');

module.exports = (sequelize, DataTypes) => {
  const Support = sequelize.define(
    'Support',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      adminName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'admin_name',
      },
      adminEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'admin_email',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: SUPPORT_STATUS.PENDING,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'admin_id',
      },
    },
    {
      tableName: 'support_tickets',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Support.associate = (models) => {
    Support.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'admin',
    });
  };

  return Support;
};
