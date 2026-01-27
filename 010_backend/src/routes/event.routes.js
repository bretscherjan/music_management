const express = require('express');
const router = express.Router();

const eventController = require('../controllers/event.controller');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
    createEventSchema,
    updateEventSchema,
    setAttendanceSchema,
    getEventByIdSchema,
    queryEventsSchema,
    bulkDeleteSchema,
    addSetlistItemSchema,
    updateSetlistItemSchema,
    removeSetlistItemSchema,
    reorderSetlistSchema,
} = require('../validations/event.validation');

/**
 * @route   GET /api/events
 * @desc    Get all events (with optional recurring expansion)
 * @access  Public (filtered by visibility)
 */
router.get('/', optionalAuth, validate(queryEventsSchema), eventController.getAllEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Public (filtered by visibility)
 */
router.get('/:id', optionalAuth, validate(getEventByIdSchema), eventController.getEventById);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Admin only
 */
router.post('/', authMiddleware, adminOnly, validate(createEventSchema), eventController.createEvent);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Admin only
 */
router.put('/:id', authMiddleware, adminOnly, validate(updateEventSchema), eventController.updateEvent);

/**
 * @route   POST /api/events/bulk-delete
 * @desc    Delete multiple events at once
 * @access  Admin only
 */
router.post('/bulk-delete', authMiddleware, adminOnly, validate(bulkDeleteSchema), eventController.bulkDeleteEvents);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, validate(getEventByIdSchema), eventController.deleteEvent);

/**
 * @route   POST /api/events/:id/exclude-date
 * @desc    Exclude a date from recurring event
 * @access  Admin only
 */
router.post('/:id/exclude-date', authMiddleware, adminOnly, eventController.excludeDate);

/**
 * @route   POST /api/events/:id/attendance
 * @desc    Set attendance for an event
 * @access  Private (authenticated users)
 */
router.post('/:id/attendance', authMiddleware, validate(setAttendanceSchema), eventController.setAttendance);

/**
 * @route   GET /api/events/:id/attendances
 * @desc    Get all attendances for an event
 * @access  Private (authenticated users)
 */
router.get('/:id/attendances', authMiddleware, validate(getEventByIdSchema), eventController.getEventAttendances);

/**
 * @route   POST /api/events/:id/send-reminders
 * @desc    Send reminders to users who haven't responded
 * @access  Admin only
 */
router.post('/:id/send-reminders', authMiddleware, adminOnly, eventController.sendReminders);

/**
 * @route   POST /api/events/:id/setlist
 * @desc    Add item to event setlist (sheet music, pause, or custom)
 * @access  Admin only
 */
router.post('/:id/setlist', authMiddleware, adminOnly, validate(addSetlistItemSchema), eventController.addItemToSetlist);

/**
 * @route   PUT /api/events/:id/setlist/reorder
 * @desc    Reorder setlist items
 * @access  Admin only
 */
router.put('/:id/setlist/reorder', authMiddleware, adminOnly, validate(reorderSetlistSchema), eventController.reorderSetlist);

/**
 * @route   PUT /api/events/:id/setlist/:itemId
 * @desc    Update setlist item (only custom/pause)
 * @access  Admin only
 */
router.put('/:id/setlist/:itemId', authMiddleware, adminOnly, validate(updateSetlistItemSchema), eventController.updateSetlistItem);

/**
 * @route   DELETE /api/events/:id/setlist/:itemId
 * @desc    Remove item from event setlist
 * @access  Admin only
 */
router.delete('/:id/setlist/:itemId', authMiddleware, adminOnly, validate(removeSetlistItemSchema), eventController.removeItemFromSetlist);

/**
 * @route   GET /api/events/:id/verification-list
 * @desc    Get list of users with attendance and verification status
 * @access  Admin only
 */
router.get('/:id/verification-list', authMiddleware, adminOnly, eventController.getVerificationList);

/**
 * @route   POST /api/events/:id/verify
 * @desc    Bulk verify attendance
 * @access  Admin only
 */
router.post('/:id/verify', authMiddleware, adminOnly, eventController.verifyAttendance);

module.exports = router;
