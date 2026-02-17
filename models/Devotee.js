'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;
const MAX_FAVORITES = 5;

module.exports = (sequelize, DataTypes) => {
  const Devotee = sequelize.define(
    'Devotee',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'mobile',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'email',
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'city',
      },
      profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_image',
      },
      otpHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'otp_hash',
      },
      otpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'otp_expires_at',
      },
    },
    {
      tableName: 'devotees',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Devotee.associate = (models) => {
    Devotee.belongsToMany(models.User, {
      through: models.DevoteeFavorite,
      foreignKey: 'devoteeId',
      otherKey: 'adminId',
      as: 'favoriteOrganizations',
    });
    Devotee.hasMany(models.DevoteeFavorite, {
      foreignKey: 'devoteeId',
      as: 'favorites',
    });
    Devotee.hasMany(models.Donation, {
      foreignKey: 'devoteeId',
      as: 'donations',
    });
  };

  Devotee.MAX_FAVORITES = MAX_FAVORITES;
  Devotee.OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;

  Devotee.prototype.setOtp = async function (otp) {
    this.otpHash = await bcrypt.hash(String(otp), SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    this.otpExpiresAt = expiresAt;
  };

  Devotee.prototype.verifyOtp = async function (otp) {
    if (!this.otpHash || !this.otpExpiresAt) return false;
    if (new Date() > this.otpExpiresAt) return false;
    return bcrypt.compare(String(otp), this.otpHash);
  };

  Devotee.prototype.toSafeObject = function () {
    const { id, mobile, name, email, city, profileImage, createdAt } = this.get();
    return { id, mobile, name, email, city, profileImage, createdAt };
  };

  return Devotee;
};
