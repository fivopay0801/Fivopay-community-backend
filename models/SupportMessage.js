'use strict';

module.exports = (sequelize, DataTypes) => {
  const SupportMessage = sequelize.define(
    'SupportMessage',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      supportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'support_id',
      },
      senderRole: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'sender_role',
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
    },
    {
      tableName: 'support_messages',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  SupportMessage.associate = (models) => {
    SupportMessage.belongsTo(models.Support, {
      foreignKey: 'supportId',
      as: 'support',
    });
  };

  return SupportMessage;
};

