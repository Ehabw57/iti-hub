const mongoose = require('mongoose');
const Event = require('../../models/Event');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { isSuperAdmin } = require('../../middlewares/checkRoles');

const USER_FIELDS = 'username fullName profilePicture';

/**
 * List events (upcoming first) with registration flag
 * GET /courses/events
 * @access Private
 */
const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find()
    .sort({ date: 1 })
    .populate('createdBy', USER_FIELDS)
    .populate('branchIds', 'name')
    .lean();

  const userId = req.user._id.toString();
  const eventsWithMeta = events.map((e) => ({
    ...e,
    attendeeCount: (e.registeredIds || []).length,
    isRegistered: (e.registeredIds || []).some((a) => a.toString() === userId),
    registeredIds: undefined,
  }));

  return sendSuccess(res, { events: eventsWithMeta });
});

/**
 * Create an event
 * POST /courses/events
 * @access Super Admin / Branch Admin / Instructor
 */
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, bannerImage, date, endDate, location, branchIds, registerUrl } = req.body;

  if (!title || !title.trim()) throw new ValidationError('Event title is required');
  if (!date) throw new ValidationError('Event date is required');

  const event = await Event.create({
    title: title.trim(),
    description: (description || '').trim(),
    bannerImage: bannerImage || null,
    date,
    endDate: endDate || null,
    location: (location || '').trim(),
    branchIds: Array.isArray(branchIds) ? branchIds : [],
    registerUrl: registerUrl || null,
    createdBy: req.user._id,
  });

  await event.populate('createdBy', USER_FIELDS);

  return sendCreated(res, { event }, 'Event created successfully');
});

/**
 * Register for an event (toggle)
 * POST /courses/events/:id/register
 * @access Private
 */
const toggleRegister = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid event ID');

  const event = await Event.findById(id);
  if (!event) throw new NotFoundError('Event');

  const userId = req.user._id.toString();
  const alreadyRegistered = event.registeredIds.some((a) => a.toString() === userId);

  if (alreadyRegistered) {
    event.registeredIds.pull(req.user._id);
    await event.save();
    return sendSuccess(res, {
      isRegistered: false,
      attendeeCount: event.registeredIds.length,
    }, 'Registration cancelled');
  }

  event.registeredIds.addToSet(req.user._id);
  await event.save();

  return sendSuccess(res, {
    isRegistered: true,
    attendeeCount: event.registeredIds.length,
  }, 'Registered for event');
});

/**
 * Delete an event
 * DELETE /courses/events/:id
 * @access Super Admin / creator
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid event ID');

  const event = await Event.findById(id);
  if (!event) throw new NotFoundError('Event');

  const isCreator = event.createdBy && event.createdBy.toString() === req.user._id.toString();
  if (!isCreator && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('You can only delete your own events');
  }

  await Event.findByIdAndDelete(id);
  return sendNoContent(res);
});

module.exports = { listEvents, createEvent, toggleRegister, deleteEvent };