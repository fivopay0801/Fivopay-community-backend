'use strict';

const { ReceiptCounter } = require('../models');

function formatReceiptNumber(n) {
  return String(n).padStart(10, '0');
}

async function getNextReceiptNumberForAdmin(adminId, transaction) {
  // Must be called inside a DB transaction for safe sequencing.
  const [counter] = await ReceiptCounter.findOrCreate({
    where: { adminId },
    defaults: { adminId, lastNumber: 0 },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  await counter.increment('lastNumber', { by: 1, transaction });
  await counter.reload({ transaction });

  return formatReceiptNumber(counter.lastNumber);
}

module.exports = {
  getNextReceiptNumberForAdmin,
  formatReceiptNumber,
};

