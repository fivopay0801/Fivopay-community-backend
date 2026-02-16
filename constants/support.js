'use strict';

const SUPPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  RESOLVED: 'resolved',
});

const SUPPORT_STATUS_LIST = Object.values(SUPPORT_STATUS);

module.exports = {
  SUPPORT_STATUS,
  SUPPORT_STATUS_LIST,
};
