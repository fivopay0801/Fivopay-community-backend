'use strict';

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
        { fields: ['admin_id', 'event_date'] },
      ],
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'organization',
    });
  };

  return Event;
};
