'use strict';

const { DONATION_STATUS } = require('../constants/donation');

module.exports = (sequelize, DataTypes) => {
  const Donation = sequelize.define(
    'Donation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      devoteeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'devotee_id',
        references: { model: 'devotees', key: 'id' },
        onDelete: 'CASCADE',
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'admin_id',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'event_id',
        references: { model: 'events', key: 'id' },
        onDelete: 'SET NULL',
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Amount in paise (INR)',
        field: 'amount',
      },
      razorpayOrderId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'razorpay_order_id',
      },
      razorpayPaymentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'razorpay_payment_id',
      },
      razorpaySignature: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'razorpay_signature',
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: DONATION_STATUS.PENDING,
        field: 'status',
      },
    },
    {
      tableName: 'donations',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['devotee_id'] },
        { fields: ['admin_id'] },
        { fields: ['event_id'] },
        { fields: ['razorpay_order_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Donation.associate = (models) => {
    Donation.belongsTo(models.Devotee, { foreignKey: 'devoteeId' });
    Donation.belongsTo(models.User, { foreignKey: 'adminId', as: 'organization' });
    Donation.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  };

  return Donation;
};
