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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount in Rupees (INR)',
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
      utr: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Unique Transaction Reference (features in UPI/IMPS/NEFT)',
        field: 'utr',
      },
      transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Bank Transaction ID or Payment Gateway Transaction ID',
        field: 'transaction_id',
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
