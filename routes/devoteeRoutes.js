'use strict';

const express = require('express');
const router = express.Router();
const devoteeController = require('../controllers/devoteeController');
const donationController = require('../controllers/donationController');
const eventController = require('../controllers/eventController');
const superAdminController = require('../controllers/superAdminController');
const { authenticateDevotee } = require('../middleware/auth');
const { optionalUploadDevoteeDetailsFiles } = require('../middleware/upload');


router.post('/send-otp', devoteeController.sendOtpHandler);
router.post('/verify-otp', devoteeController.verifyOtp);


router.get('/me', authenticateDevotee, devoteeController.getMe);
router.put('/details', authenticateDevotee, optionalUploadDevoteeDetailsFiles, devoteeController.updateDetails);


router.get('/organization-types', devoteeController.getOrganizationTypes);
router.get('/organizations', devoteeController.getOrganizations);
router.get('/admins', authenticateDevotee, superAdminController.getAllAdmins);


router.get('/favorites', authenticateDevotee, devoteeController.getFavorites);
router.post('/favorites', authenticateDevotee, devoteeController.setFavorites);
router.put('/favorites', authenticateDevotee, devoteeController.updateFavorites);
router.get('/favorites/events', authenticateDevotee, eventController.getFavoritesEvents);

router.get('/organizations/:adminId/events', eventController.getOrganizationEvents);


router.post('/donation/create-order', authenticateDevotee, donationController.createDonationOrder);
router.post('/donation/verify', authenticateDevotee, donationController.verifyDonation);
router.post('/donation/sync/:id', authenticateDevotee, donationController.checkDonationStatus);
router.get('/donation/invoice/:id', authenticateDevotee, donationController.getDonationInvoice);
router.get('/donations', authenticateDevotee, donationController.getMyDonations);
router.get('/stats', authenticateDevotee, donationController.getStats);

router.post('/support', authenticateDevotee, devoteeController.raiseSupport);
router.get('/support', authenticateDevotee, devoteeController.getMySupportTickets);
router.get('/support/:id', authenticateDevotee, devoteeController.getSupportTicketWithMessages);
router.post('/support/:id/message', authenticateDevotee, devoteeController.addSupportMessageAsDevotee);

module.exports = router;
