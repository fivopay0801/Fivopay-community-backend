'use strict';

/**
 * Organization Categories.
 */
const ORGANIZATION_CATEGORIES = Object.freeze({
    FAITH: 'faith',
    NGO: 'ngo',
});

const ORGANIZATION_CATEGORIES_LIST = Object.values(ORGANIZATION_CATEGORIES);

/**
 * Faiths for Faith Category.
 */
const FAITHS = Object.freeze({
    HINDUISM: 'hinduism',
    ISLAM: 'islam',
    CHRISTIANITY: 'christianity',
    SIKHISM: 'sikhism',
    OTHER: 'other',
});

const FAITHS_LIST = Object.values(FAITHS);

/**
 * Organization Subtypes grouped by Faith.
 */
const ORGANIZATION_SUBTYPES = Object.freeze({
    [FAITHS.HINDUISM]: ['temple', 'ashram', 'gurukul', 'dharmsala', 'gausala'],
    [FAITHS.ISLAM]: ['dargah', 'masjid', 'madrasa'],
    [FAITHS.CHRISTIANITY]: ['church', 'convent', 'seminary'],
    [FAITHS.SIKHISM]: ['gurudwara'],
    [FAITHS.OTHER]: ['other'],
});

/**
 * Get all possible subtypes as a flat list.
 */
const ALL_SUBTYPES_LIST = Object.values(ORGANIZATION_SUBTYPES).flat();

module.exports = {
    ORGANIZATION_CATEGORIES,
    ORGANIZATION_CATEGORIES_LIST,
    FAITHS,
    FAITHS_LIST,
    ORGANIZATION_SUBTYPES,
    ALL_SUBTYPES_LIST,
};
