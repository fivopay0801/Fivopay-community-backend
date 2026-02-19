'use strict';

const bcrypt = require('bcrypt');
const { ROLES } = require('../constants/roles');

const SALT_ROUNDS = 10;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_image',
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: ROLES.ADMIN,
      },
      organizationType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'organization_type',
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by_id',
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: {
          attributes: { exclude: [] },
        },
      },
      hooks: {
        beforeValidate(user) {
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
        },
      },
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy',
    });
    User.hasMany(models.User, {
      foreignKey: 'createdById',
      as: 'createdAdmins',
    });
    User.hasMany(models.DevoteeFavorite, {
      foreignKey: 'adminId',
      as: 'devoteeFavorites',
    });
    User.hasMany(models.Donation, {
      foreignKey: 'adminId',
      as: 'donations',
    });
    User.hasMany(models.Event, {
      foreignKey: 'adminId',
      as: 'events',
    });
  };

  User.prototype.setPassword = async function (plainPassword) {
    this.passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  };

  User.prototype.checkPassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
  };

  User.prototype.toSafeObject = function () {
    const { id, email, name, address, phone, profileImage, role, organizationType, isActive, createdAt, latitude, longitude } = this.get();
    return {
      id, email, name, address, phone, profileImage, role, organizationType, isActive, createdAt,
      latitude, longitude,
      googleMapLink: (latitude && longitude) ? `https://www.google.com/maps?q=${latitude},${longitude}` : null
    };
  };

  return User;
};
