'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const eventController = require('../controllers/eventController');
const { authenticate, requireSuperAdmin, requireAdmin } = require('../middleware/auth');
const { optionalUploadImage, optionalUploadEventImage } = require('../middleware/upload');

router.post('/', authenticate, requireSuperAdmin, adminController.create);
router.post('/login', adminController.login);

router.get('/me', authenticate, requireAdmin, adminController.getMe);
router.get('/profile', authenticate, requireAdmin, adminController.getProfile);
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.put('/profile', authenticate, requireAdmin, optionalUploadImage, adminController.updateProfile);
router.delete('/profile', authenticate, requireAdmin, adminController.deleteProfile);

router.post('/support', authenticate, requireAdmin, adminController.raiseSupport);
router.get('/support', authenticate, requireAdmin, adminController.getMySupportTickets);
router.patch('/support/:id', authenticate, requireAdmin, adminController.updateSupportStatus);

router.get('/devotees', authenticate, requireAdmin, adminController.getMyDevotees);

router.get('/transactions', authenticate, requireAdmin, adminController.getDevoteeTransactions);

router.get('/event-types', authenticate, requireAdmin, eventController.getEventTypes);
router.post('/events', authenticate, requireAdmin, optionalUploadEventImage, eventController.createEvent);
router.get('/events', authenticate, requireAdmin, eventController.getAdminEvents);
router.put('/events/:id', authenticate, requireAdmin, optionalUploadEventImage, eventController.updateEvent);
router.delete('/events/:id', authenticate, requireAdmin, eventController.deleteEvent);

module.exports = router;
