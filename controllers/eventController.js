'use strict';

const { Op } = require('sequelize');
const { Event, User, DevoteeFavorite } = require('../models');
const { ROLES } = require('../constants/roles');
const { success, error } = require('../utils/response');
const { validateCreateEvent, validateUpdateEvent } = require('../validators/eventValidator');

/**
 * POST /api/admin/events
 * Create an upcoming event for the admin's organization.
 * Body: { title, eventDate, description?, startTime?, endTime?, location?, imageUrl? }
 */
async function createEvent(req, res, next) {
  try {
    const validation = validateCreateEvent(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const admin = req.user;
    const event = await Event.create({
      adminId: admin.id,
      ...validation.data,
    });

    return success(res, { event: eventToResponse(event) }, 'Event created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/events
 * List all events for the admin's organization (upcoming first, paginated).
 * Query: ?page=1&limit=20&upcoming=true (default: upcoming only)
 */
async function getAdminEvents(req, res, next) {
  try {
    const adminId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const upcomingOnly = req.query.upcoming !== 'false';

    const today = new Date().toISOString().split('T')[0];

    const where = { adminId, isActive: true };
    if (upcomingOnly) {
      where.eventDate = { [Op.gte]: today };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      order: [
        ['eventDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const events = rows.map((e) => eventToResponse(e));

    return success(res, {
      events,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/events/:id
 * Update an event (must belong to admin).
 */
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const admin = req.user;

    const event = await Event.findOne({
      where: { id, adminId: admin.id },
    });
    if (!event) {
      return error(res, 'Event not found.', 404);
    }

    const validation = validateUpdateEvent(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    await event.update(validation.data);
    return success(res, { event: eventToResponse(event) }, 'Event updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/events/:id
 * Delete (deactivate) an event.
 */
async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const admin = req.user;

    const event = await Event.findOne({
      where: { id, adminId: admin.id },
    });
    if (!event) {
      return error(res, 'Event not found.', 404);
    }

    await event.update({ isActive: false });
    return success(res, null, 'Event deleted successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/organizations/:adminId/events
 * Get upcoming events for an organization (for devotees viewing favorites).
 */
async function getOrganizationEvents(req, res, next) {
  try {
    const adminId = parseInt(req.params.adminId, 10);
    if (isNaN(adminId) || adminId <= 0) {
      return error(res, 'Invalid organization ID.', 422);
    }

    const today = new Date().toISOString().split('T')[0];

    const admin = await User.findOne({
      where: { id: adminId, role: ROLES.ADMIN, isActive: true },
      attributes: ['id', 'name', 'organizationType', 'profileImage'],
    });
    if (!admin) {
      return error(res, 'Organization not found.', 404);
    }

    const events = await Event.findAll({
      where: {
        adminId,
        eventDate: { [Op.gte]: today },
        isActive: true,
      },
      order: [
        ['eventDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    const list = events.map((e) => eventToResponse(e));

    return success(res, {
      organization: admin.get({ plain: true }),
      events: list,
      total: list.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/favorites/events
 * Get upcoming events for all favorite organizations.
 */
async function getFavoritesEvents(req, res, next) {
  try {
    const devotee = req.devotee;
    const today = new Date().toISOString().split('T')[0];

    const favorites = await DevoteeFavorite.findAll({
      where: { devoteeId: devotee.id },
      include: [
        {
          model: User,
          as: 'organization',
          attributes: ['id', 'name', 'organizationType', 'profileImage'],
        },
      ],
      order: [['displayOrder', 'ASC']],
    });

    const adminIds = favorites.map((f) => f.adminId);

    const events = await Event.findAll({
      where: {
        adminId: adminIds,
        eventDate: { [Op.gte]: today },
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'organization',
          attributes: ['id', 'name', 'organizationType', 'profileImage'],
        },
      ],
      order: [
        ['eventDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    const list = events.map((e) => {
      const ev = eventToResponse(e);
      ev.organization = e.organization ? e.organization.get({ plain: true }) : null;
      return ev;
    });

    return success(res, {
      events: list,
      total: list.length,
    });
  } catch (err) {
    next(err);
  }
}

function eventToResponse(event) {
  const plain = event.get ? event.get({ plain: true }) : event;
  return {
    id: plain.id,
    adminId: plain.adminId,
    title: plain.title,
    description: plain.description,
    eventDate: plain.eventDate,
    startTime: plain.startTime,
    endTime: plain.endTime,
    location: plain.location,
    imageUrl: plain.imageUrl,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
  };
}

module.exports = {
  createEvent,
  getAdminEvents,
  updateEvent,
  deleteEvent,
  getOrganizationEvents,
  getFavoritesEvents,
};
