'use strict';

const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { optionalUploadImage } = require('../middleware/upload');

router.post('/register', superAdminController.register);
router.post('/login', superAdminController.login);

router.get('/me', authenticate, requireSuperAdmin, superAdminController.getMe);
router.get('/profile', authenticate, requireSuperAdmin, superAdminController.getProfile);
router.put('/profile', authenticate, requireSuperAdmin, optionalUploadImage, superAdminController.updateProfile);
router.delete('/profile', authenticate, requireSuperAdmin, superAdminController.deleteProfile);

router.get('/admins', authenticate, requireSuperAdmin, superAdminController.getAllAdmins);
router.get('/devotees', authenticate, requireSuperAdmin, superAdminController.getAllDevotees);

router.get('/support', authenticate, requireSuperAdmin, superAdminController.getAllSupportTickets);
router.patch('/support/:id', authenticate, requireSuperAdmin, superAdminController.updateSupportStatus);

module.exports = router;
