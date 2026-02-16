'use strict';

/**
 * User roles for the donation platform.
 * SUPER_ADMIN: Chairman - can create and manage admins.
 * ADMIN: Organization admin (church, masjid, gurudwara, etc.).
 */
const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
});

/**
 * Organization types for admin users (church, masjid, gurudwara, temple).
 */
const ORGANIZATION_TYPES = Object.freeze({
  CHURCH: 'church',
  MASJID: 'masjid',
  GURUDWARA: 'gurudwara',
  TEMPLE: 'temple',
});

const ORGANIZATION_TYPES_LIST = Object.values(ORGANIZATION_TYPES);

module.exports = {
  ROLES,
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPES_LIST,
};
