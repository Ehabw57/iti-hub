const mongoose = require('mongoose');
const Job = require('../../models/Job');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { isSuperAdmin } = require('../../middlewares/checkRoles');

const USER_FIELDS = 'username fullName profilePicture';

/**
 * List jobs (newest first)
 * GET /courses/jobs
 * @access Private
 */
const listJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate('postedBy', USER_FIELDS)
    .lean();
  return sendSuccess(res, { jobs });
});

/**
 * Create a job posting
 * POST /courses/jobs
 * @access Super Admin / Branch Admin / Instructor
 */
const createJob = asyncHandler(async (req, res) => {
  const { title, company, companyLogo, location, description, tags, applyUrl } = req.body;

  if (!title || !title.trim()) throw new ValidationError('Job title is required');
  if (!company || !company.trim()) throw new ValidationError('Company is required');
  if (!applyUrl || !applyUrl.trim()) throw new ValidationError('Apply URL is required');

  const job = await Job.create({
    title: title.trim(),
    company: company.trim(),
    companyLogo: companyLogo || null,
    location: (location || '').trim(),
    description: (description || '').trim(),
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    applyUrl: applyUrl.trim(),
    postedBy: req.user._id,
  });

  await job.populate('postedBy', USER_FIELDS);

  return sendCreated(res, { job }, 'Job posted successfully');
});

/**
 * Delete a job posting
 * DELETE /courses/jobs/:id
 * @access Super Admin / poster
 */
const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid job ID');

  const job = await Job.findById(id);
  if (!job) throw new NotFoundError('Job');

  const isPoster = job.postedBy && job.postedBy.toString() === req.user._id.toString();
  if (!isPoster && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('You can only delete your own job postings');
  }

  await Job.findByIdAndDelete(id);
  return sendNoContent(res);
});

module.exports = { listJobs, createJob, deleteJob };