'use strict';

/**
 * Event types for dynamic event model.
 * GENERAL: Simple event (meeting, festival, etc.)
 * CROWDFUNDING: Fundraising with target amount
 * CHARITY: Charity/cause with optional target amount
 */
const EVENT_TYPES = Object.freeze({
  GENERAL: 'general',
  CROWDFUNDING: 'crowdfunding',
  CHARITY: 'charity',
});

const EVENT_TYPES_LIST = Object.values(EVENT_TYPES);

const EVENT_TYPES_WITH_TARGET = [EVENT_TYPES.CROWDFUNDING, EVENT_TYPES.CHARITY];

module.exports = {
  EVENT_TYPES,
  EVENT_TYPES_LIST,
  EVENT_TYPES_WITH_TARGET,
};
