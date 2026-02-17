'use strict';

const NAME_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 500;

function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, message: 'Event title is required.' };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: 'Event title cannot be empty.' };
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, message: `Title must be at most ${NAME_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed };
}

function validateEventDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, message: 'Event date is required.' };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid event date format (use YYYY-MM-DD).' };
  }
  return { valid: true, value: dateStr };
}

function validateTime(timeStr, fieldName = 'Time') {
  if (!timeStr || typeof timeStr !== 'string') {
    return { valid: true, value: null };
  }
  const trimmed = timeStr.trim();
  if (trimmed.length === 0) return { valid: true, value: null };
  // Accept HH:MM or HH:MM:SS
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(trimmed)) {
    return { valid: false, message: `Invalid ${fieldName} format (use HH:MM).` };
  }
  return { valid: true, value: trimmed };
}

function validateCreateEvent(body) {
  const errors = [];
  const titleResult = validateTitle(body.title);
  if (!titleResult.valid) errors.push(titleResult.message);

  const dateResult = validateEventDate(body.eventDate);
  if (!dateResult.valid) errors.push(dateResult.message);

  const startResult = validateTime(body.startTime, 'start time');
  if (!startResult.valid) errors.push(startResult.message);

  const endResult = validateTime(body.endTime, 'end time');
  if (!endResult.valid) errors.push(endResult.message);

  let location = null;
  if (body.location !== undefined && body.location !== null && body.location !== '') {
    const loc = String(body.location).trim();
    if (loc.length > LOCATION_MAX_LENGTH) {
      errors.push(`Location must be at most ${LOCATION_MAX_LENGTH} characters.`);
    } else {
      location = loc || null;
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      title: titleResult.value,
      eventDate: dateResult.value,
      description: body.description ? String(body.description).trim() : null,
      startTime: startResult.value,
      endTime: endResult.value,
      location,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    },
  };
}

function validateUpdateEvent(body) {
  const errors = [];
  const data = {};

  if (body.title !== undefined) {
    const r = validateTitle(body.title);
    if (!r.valid) errors.push(r.message);
    else data.title = r.value;
  }
  if (body.eventDate !== undefined) {
    const r = validateEventDate(body.eventDate);
    if (!r.valid) errors.push(r.message);
    else data.eventDate = r.value;
  }
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }
  if (body.startTime !== undefined) {
    const r = validateTime(body.startTime, 'start time');
    if (!r.valid) errors.push(r.message);
    else data.startTime = r.value;
  }
  if (body.endTime !== undefined) {
    const r = validateTime(body.endTime, 'end time');
    if (!r.valid) errors.push(r.message);
    else data.endTime = r.value;
  }
  if (body.location !== undefined) {
    const loc = body.location ? String(body.location).trim() : null;
    if (loc && loc.length > LOCATION_MAX_LENGTH) {
      errors.push(`Location must be at most ${LOCATION_MAX_LENGTH} characters.`);
    } else {
      data.location = loc || null;
    }
  }
  if (body.imageUrl !== undefined) {
    data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
  }
  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data };
}

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
};
