'use strict';

const { Op } = require('sequelize');
const { Event, User, DevoteeFavorite, sequelize } = require('../models');
const { ROLES } = require('../constants/roles');
const { EVENT_TYPES_LIST } = require('../constants/eventTypes');
const { success, error } = require('../utils/response');
const { validateCreateEvent, validateUpdateEvent } = require('../validators/eventValidator');
const { deleteFileFromS3 } = require('../middleware/upload');

/**
 * POST /api/admin/events
 * Create an event (general, crowdfunding, or charity).
 * Body (JSON or multipart): eventType, title, eventDate, endDate?, targetAmount?, description?, startTime?, endTime?, location?, metadata?
 * Optional: multipart with 'image' field for event image (S3).
 */
async function createEvent(req, res, next) {
  try {
    const validation = validateCreateEvent(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const admin = req.user;
    const { title, eventDate, startTime } = validation.data;

    const duplicate = await Event.findOne({
      where: {
        adminId: admin.id,
        title,
        eventDate,
        startTime: startTime || null,
        isActive: true,
        [Op.and]: [
          sequelize.where(sequelize.col('created_at'), Op.gte, new Date(Date.now() - 60000)),
        ],
      },
    });
    if (duplicate) {
      return error(res, 'A similar event was just created. Please refresh to see it.', 409);
    }

    const eventData = { ...validation.data };
    if (req.file && req.file.location) {
      eventData.imageUrl = req.file.location;
    }

    const event = await Event.create({
      adminId: admin.id,
      ...eventData,
    });

    return success(res, { event: eventToResponse(event) }, 'Event created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/event-types
 * List available event types (general, crowdfunding, charity).
 */
async function getEventTypes(req, res, next) {
  try {
    const types = EVENT_TYPES_LIST.map((t) => ({
      type: t,
      label: t.charAt(0).toUpperCase() + t.slice(1),
    }));
    return success(res, { eventTypes: types });
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
      order: sequelize.literal('"Event"."event_date" ASC, "Event"."start_time" ASC NULLS LAST'),
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

    const updates = { ...validation.data };
    if (req.file && req.file.location) {
      if (event.imageUrl) {
        await deleteFileFromS3(event.imageUrl);
      }
      updates.imageUrl = req.file.location;
    }

    await event.update(updates);
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
      order: sequelize.literal('"Event"."event_date" ASC, "Event"."start_time" ASC NULLS LAST'),
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
      order: sequelize.literal('"Event"."event_date" ASC, "Event"."start_time" ASC NULLS LAST'),
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
  const targetPaise = plain.targetAmountPaise ?? null;
  const raisedPaise = Number(plain.raisedAmountPaise ?? 0);
  const progressPercentage = targetPaise && targetPaise > 0
    ? Math.min(100, Math.round((raisedPaise / targetPaise) * 100))
    : null;
  return {
    id: plain.id,
    adminId: plain.adminId,
    eventType: plain.eventType,
    title: plain.title,
    description: plain.description,
    eventDate: plain.eventDate,
    endDate: plain.endDate,
    startTime: plain.startTime,
    endTime: plain.endTime,
    location: plain.location,
    imageUrl: plain.imageUrl,
    targetAmountPaise: targetPaise,
    targetAmountRupees: targetPaise ? (targetPaise / 100).toFixed(2) : null,
    raisedAmountPaise: raisedPaise,
    raisedAmountRupees: (raisedPaise / 100).toFixed(2),
    progressPercentage,
    metadata: plain.metadata,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
  };
}

module.exports = {
  createEvent,
  getEventTypes,
  getAdminEvents,
  updateEvent,
  deleteEvent,
  getOrganizationEvents,
  getFavoritesEvents,
};
