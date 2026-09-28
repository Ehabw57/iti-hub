const express = require('express');
const { checkAuth } = require('../middlewares/checkAuth');
const { requireRoles } = require('../middlewares/checkRoles');

const { listJobs, createJob, deleteJob } = require('../controllers/course/jobController');

/**
 * Job routes — independent top-level section (not nested under
 * branches or community). Mounted at `/jobs`.
 */
const jobRoutes = express.Router();

jobRoutes.get('/', checkAuth, listJobs);
jobRoutes.post('/', checkAuth, requireRoles('super_admin', 'branch_admin', 'instructor'), createJob);
jobRoutes.delete('/:id', checkAuth, deleteJob);

module.exports = jobRoutes;
