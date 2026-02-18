'use strict';

const { EVENT_TYPES_LIST, EVENT_TYPES_WITH_TARGET } = require('../constants/eventTypes');

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

function validateEventType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, message: 'Event type is required.' };
  }
  const normalized = type.toLowerCase().trim();
  if (!EVENT_TYPES_LIST.includes(normalized)) {
    return {
      valid: false,
      message: `Event type must be one of: ${EVENT_TYPES_LIST.join(', ')}.`,
    };
  }
  return { valid: true, value: normalized };
}

function validateTargetAmount(amount, required = false) {
  if (amount === undefined || amount === null) {
    return required ? { valid: false, message: 'Target amount is required for this event type.' } : { valid: true, value: null };
  }
  const num = Number(amount);
  if (isNaN(num) || num < 1) {
    return { valid: false, message: 'Target amount must be a positive number.' };
  }
  if (num > 100000000000) {
    return { valid: false, message: 'Target amount exceeds maximum.' };
  }
  return { valid: true, value: Math.round(num * 100) };
}

function validateCreateEvent(body) {
  const errors = [];
  const titleResult = validateTitle(body.title);
  if (!titleResult.valid) errors.push(titleResult.message);

  const typeResult = validateEventType(body.eventType);
  if (!typeResult.valid) errors.push(typeResult.message);

  const dateResult = validateEventDate(body.eventDate);
  if (!dateResult.valid) errors.push(dateResult.message);

  const startResult = validateTime(body.startTime, 'start time');
  if (!startResult.valid) errors.push(startResult.message);

  const endResult = validateTime(body.endTime, 'end time');
  if (!endResult.valid) errors.push(endResult.message);

  const endDateResult = body.endDate ? validateEventDate(body.endDate) : { valid: true, value: null };
  if (endDateResult.valid === false) errors.push(endDateResult.message);
  if (endDateResult.valid && endDateResult.value && dateResult.valid && dateResult.value && endDateResult.value < dateResult.value) {
    errors.push('End date must be on or after event start date.');
  }

  let location = null;
  if (body.location !== undefined && body.location !== null && body.location !== '') {
    const loc = String(body.location).trim();
    if (loc.length > LOCATION_MAX_LENGTH) {
      errors.push(`Location must be at most ${LOCATION_MAX_LENGTH} characters.`);
    } else {
      location = loc || null;
    }
  }

  const eventType = typeResult.valid ? typeResult.value : null;
  const targetRequired = eventType && EVENT_TYPES_WITH_TARGET.includes(eventType);
  const targetResult = validateTargetAmount(body.targetAmount, targetRequired);
  if (!targetResult.valid) errors.push(targetResult.message);

  if (errors.length > 0) return { valid: false, errors };

  const data = {
    eventType: typeResult.value,
    title: titleResult.value,
    eventDate: dateResult.value,
    endDate: endDateResult.valid ? endDateResult.value : null,
    description: body.description ? String(body.description).trim() : null,
    startTime: startResult.value,
    endTime: endResult.value,
    location,
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    targetAmountPaise: targetResult.value,
    raisedAmountPaise: 0,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : null,
  };
  return { valid: true, data };
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
  if (body.endDate !== undefined) {
    if (!body.endDate) data.endDate = null;
    else {
      const r = validateEventDate(body.endDate);
      if (!r.valid) errors.push(r.message);
      else data.endDate = r.value;
    }
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
  if (body.eventType !== undefined) {
    const r = validateEventType(body.eventType);
    if (!r.valid) errors.push(r.message);
    else data.eventType = r.value;
  }
  if (body.targetAmountPaise !== undefined || body.targetAmount !== undefined) {
    const val = body.targetAmountPaise ?? body.targetAmount;
    const r = validateTargetAmount(val, false);
    if (!r.valid) errors.push(r.message);
    else data.targetAmountPaise = r.value;
  }
  if (body.metadata !== undefined) {
    data.metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;
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
