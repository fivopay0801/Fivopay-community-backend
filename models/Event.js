'use strict';

const { EVENT_TYPES } = require('../constants/eventTypes');

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
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
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: EVENT_TYPES.GENERAL,
        field: 'event_type',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'title',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'event_date',
      },
      startTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'start_time',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'end_date',
      },
      endTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'end_time',
      },
      location: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'location',
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_url',
      },
      targetAmountPaise: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Target amount in paise (for crowdfunding/charity)',
        field: 'target_amount_paise',
      },
      raisedAmountPaise: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Raised amount in paise',
        field: 'raised_amount_paise',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'metadata',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'events',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['admin_id'] },
        { fields: ['event_date'] },
        { fields: ['event_type'] },
        { fields: ['admin_id', 'event_date'] },
      ],
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'organization',
    });
    Event.hasMany(models.Donation, {
      foreignKey: 'eventId',
      as: 'donations',
    });
  };

  return Event;
};
