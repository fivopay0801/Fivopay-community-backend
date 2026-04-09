'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReceiptCounter = sequelize.define(
    'ReceiptCounter',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'admin_id',
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lastNumber: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        field: 'last_number',
      },
    },
    {
      tableName: 'receipt_counters',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['admin_id'], unique: true }],
    }
  );

  ReceiptCounter.associate = (models) => {
    ReceiptCounter.belongsTo(models.User, { foreignKey: 'adminId', as: 'organization' });
  };

  return ReceiptCounter;
};

