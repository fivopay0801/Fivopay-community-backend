'use strict';

module.exports = (sequelize, DataTypes) => {
  const DevoteeFavorite = sequelize.define(
    'DevoteeFavorite',
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
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'display_order',
      },
    },
    {
      tableName: 'devotee_favorites',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['devotee_id', 'admin_id'] },
      ],
    }
  );

  DevoteeFavorite.associate = (models) => {
    DevoteeFavorite.belongsTo(models.Devotee, { foreignKey: 'devoteeId' });
    DevoteeFavorite.belongsTo(models.User, { foreignKey: 'adminId', as: 'organization' });
  };

  return DevoteeFavorite;
};
