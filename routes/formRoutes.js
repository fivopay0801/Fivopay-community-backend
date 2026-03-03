'use strict';

const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { uploadOnboardingDocs } = require('../middleware/upload');

/**
 * @route POST /api/form/onboarding
 * @desc Submit or update onboarding form
 * @access Public
 */
router.post(
    '/onboarding',
    uploadOnboardingDocs,
    formController.submitOnboardingForm
);

/**
 * @route GET /api/form/onboarding/:id?
 * @desc Get onboarding form details
 * @access Public
 */
router.get(
    '/onboarding/:id?',
    formController.getOnboardingForm
);

module.exports = router;
