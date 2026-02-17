'use strict';

const DONATION_STATUS = Object.freeze({
  PENDING: 'pending',
  CAPTURED: 'captured',
  FAILED: 'failed',
});

const DONATION_STATUS_LIST = Object.values(DONATION_STATUS);

module.exports = {
  DONATION_STATUS,
  DONATION_STATUS_LIST,
};
