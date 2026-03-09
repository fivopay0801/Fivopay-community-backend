'use strict';

const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { uploadOnboardingDocs } = require('../middleware/upload');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

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

/**
 * @route GET /api/form/onboarding-list
 * @desc Get all onboarding forms
 * @access Super Admin
 */
router.get(
    '/onboarding-list',
    authenticate,
    requireSuperAdmin,
    formController.getAllOnboardingForms
);

/**
 * @route POST /api/form/contact
 * @desc Submit contact form
 * @access Public
 */
router.post(
    '/contact',
    formController.submitContactForm
);

module.exports = router;
