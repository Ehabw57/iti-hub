const express = require('express');
const { checkAuth } = require('../middlewares/checkAuth');
const { requireRoles } = require('../middlewares/checkRoles');

const { listEvents, createEvent, toggleRegister, deleteEvent } = require('../controllers/course/eventController');

/**
 * Event routes — independent top-level section (not nested under
 * branches or community). Mounted at `/events`.
 */
const eventRoutes = express.Router();

eventRoutes.get('/', checkAuth, listEvents);
eventRoutes.post('/', checkAuth, requireRoles('super_admin', 'branch_admin', 'instructor'), createEvent);
eventRoutes.post('/:id/register', checkAuth, toggleRegister);
eventRoutes.delete('/:id', checkAuth, deleteEvent);

module.exports = eventRoutes;
