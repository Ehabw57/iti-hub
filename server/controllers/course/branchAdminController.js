const mongoose = require('mongoose');
const Branch = require('../../models/Branch');
const Round = require('../../models/Round');
const Track = require('../../models/Track');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated } = require('../../utils/responseHelpers');
const { canManageBranch } = require('../../middlewares/checkRoles');
const { deleteRoundsCascade, deleteBranchCascade } = require('../../utils/cascadeDelete');

const BRANCH_TYPES = ['core', 'extension'];

/**
 * Create a branch
 * POST /courses/branches
 * @access Super Admin
 */
const createBranch = asyncHandler(async (req, res) => {
  const { name, location, type, logo, coverImage } = req.body;

  if (!name || !name.trim()) {
    throw new ValidationError('Branch name is required');
  }
  if (type && !BRANCH_TYPES.includes(type)) {
    throw new ValidationError('Branch type must be one of: core, extension');
  }

  const existing = await Branch.findOne({ name: name.trim() });
  if (existing) {
    throw new ValidationError('A branch with this name already exists');
  }

  const branch = await Branch.create({
    name: name.trim(),
    location: (location || '').trim(),
    type: type || 'core',
    logo: logo || null,
    coverImage: coverImage || null,
  });

  return sendCreated(res, { branch }, 'Branch created successfully');
});

/**
 * Update a branch
 * PATCH /courses/branches/:id
 * @access Super Admin
 */
const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid branch ID');
  }

  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundError('Branch');

  const { name, location, type, logo, coverImage } = req.body;
  if (name !== undefined) {
    if (!name.trim()) throw new ValidationError('Branch name cannot be empty');
    const clash = await Branch.findOne({ name: name.trim(), _id: { $ne: branch._id } });
    if (clash) throw new ValidationError('A branch with this name already exists');
    branch.name = name.trim();
  }
  if (location !== undefined) branch.location = location.trim();
  if (type !== undefined) {
    if (!BRANCH_TYPES.includes(type)) {
      throw new ValidationError('Branch type must be one of: core, extension');
    }
    branch.type = type;
  }
  if (logo !== undefined) branch.logo = logo;
  if (coverImage !== undefined) branch.coverImage = coverImage;

  await branch.save();
  return sendSuccess(res, { branch }, 'Branch updated successfully');
});

/**
 * Delete a branch (cascades: removes all of its rounds, their tracks,
 * track content and cleans up user.trackIds references)
 * DELETE /courses/branches/:id
 * @access Super Admin
 */
const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid branch ID');
  }

  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundError('Branch');

  const { rounds, tracks } = await deleteBranchCascade(branch._id);

  return sendSuccess(
    res,
    { removed: { rounds, tracks } },
    'Branch deleted successfully'
  );
});

/**
 * List rounds for a branch
 * GET /courses/branches/:branchId/rounds
 * @access Public
 */
const listRounds = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new ValidationError('Invalid branch ID');
  }

  const rounds = await Round.find({ branchId }).sort({ startDate: -1, createdAt: -1 }).lean();

  // Track counts per round
  const trackCounts = await Track.aggregate([
    { $match: { branchId: new mongoose.Types.ObjectId(branchId) } },
    { $group: { _id: '$roundId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(trackCounts.map((t) => [String(t._id), t.count]));

  const roundsWithStats = rounds.map((round) => ({
    ...round,
    trackCount: countMap.get(String(round._id)) || 0,
  }));

  return sendSuccess(res, { rounds: roundsWithStats });
});

/**
 * Create a round in a branch
 * POST /courses/branches/:branchId/rounds
 * @access Super Admin / Branch Admin (own branch)
 */
const createRound = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new ValidationError('Invalid branch ID');
  }

  if (!canManageBranch(req.user, branchId)) {
    throw new ForbiddenError('You do not have permission to manage this branch');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) throw new NotFoundError('Branch');

  const { name, startDate, endDate, isActive } = req.body;
  if (!name || !name.trim()) {
    throw new ValidationError('Round name is required');
  }

  const round = await Round.create({
    branchId,
    name: name.trim(),
    startDate: startDate || null,
    endDate: endDate || null,
    isActive: !!isActive,
  });

  return sendCreated(res, { round }, 'Round created successfully');
});

/**
 * Update a round
 * PATCH /courses/rounds/:id
 * @access Super Admin / Branch Admin (own branch)
 */
const updateRound = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid round ID');
  }

  const round = await Round.findById(id);
  if (!round) throw new NotFoundError('Round');

  if (!canManageBranch(req.user, round.branchId)) {
    throw new ForbiddenError('You do not have permission to manage this round');
  }

  const { name, startDate, endDate, isActive } = req.body;
  if (name !== undefined) round.name = name.trim();
  if (startDate !== undefined) round.startDate = startDate;
  if (endDate !== undefined) round.endDate = endDate;
  if (isActive !== undefined) round.isActive = !!isActive;

  await round.save();
  return sendSuccess(res, { round }, 'Round updated successfully');
});

/**
 * Delete a round (cascades: removes all of its tracks, track content
 * and cleans up user.trackIds references)
 * DELETE /courses/rounds/:id
 * @access Super Admin / Branch Admin (own branch)
 */
const deleteRound = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid round ID');
  }

  const round = await Round.findById(id);
  if (!round) throw new NotFoundError('Round');

  if (!canManageBranch(req.user, round.branchId)) {
    throw new ForbiddenError('You do not have permission to manage this round');
  }

  const { tracks } = await deleteRoundsCascade([round._id]);

  return sendSuccess(res, { removed: { tracks } }, 'Round deleted successfully');
});

module.exports = {
  createBranch,
  updateBranch,
  deleteBranch,
  listRounds,
  createRound,
  updateRound,
  deleteRound,
};