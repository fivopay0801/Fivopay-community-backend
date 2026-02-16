'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireSuperAdmin, requireAdmin } = require('../middleware/auth');
const { optionalUploadImage } = require('../middleware/upload');

router.post('/', authenticate, requireSuperAdmin, adminController.create);
router.post('/login', adminController.login);

router.get('/me', authenticate, requireAdmin, adminController.getMe);
router.get('/profile', authenticate, requireAdmin, adminController.getProfile);
router.put('/profile', authenticate, requireAdmin, optionalUploadImage, adminController.updateProfile);
router.delete('/profile', authenticate, requireAdmin, adminController.deleteProfile);

router.post('/support', authenticate, requireAdmin, adminController.raiseSupport);
router.get('/support', authenticate, requireAdmin, adminController.getMySupportTickets);

module.exports = router;
