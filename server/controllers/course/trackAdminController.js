const mongoose = require('mongoose');
const Track = require('../../models/Track');
const Round = require('../../models/Round');
const User = require('../../models/User');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated } = require('../../utils/responseHelpers');
const { canManageBranch, canManageTrack, canUploadToTrack } = require('../../middlewares/checkRoles');
const { deleteTracksCascade } = require('../../utils/cascadeDelete');

const USER_PUBLIC_FIELDS = 'username fullName profilePicture role';

/** Allowed track categories — single source: the Track model enum. */
const TRACK_CATEGORIES = Track.schema.path('category').enumValues;

/**
 * List tracks for a round (Round → Tracks view)
 * GET /courses/rounds/:roundId/tracks
 * @access Public
 */
const listRoundTracks = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(roundId)) {
    throw new ValidationError('Invalid round ID');
  }

  const round = await Round.findById(roundId).lean();
  if (!round) throw new NotFoundError('Round');

  const tracks = await Track.find({ roundId: round._id })
    .sort({ name: 1 })
    .populate('instructorIds', USER_PUBLIC_FIELDS)
    .lean();

  const tracksWithStats = tracks.map((track) => ({
    ...track,
    studentCount: (track.studentIds || []).length,
    // Never expose full student id list on list views
    studentIds: undefined,
  }));

  return sendSuccess(res, { round, tracks: tracksWithStats });
});

/**
 * Create a track inside a round
 * POST /courses/rounds/:roundId/tracks
 * @access Super Admin / Branch Admin (own branch)
 */
const createTrack = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(roundId)) {
    throw new ValidationError('Invalid round ID');
  }

  const round = await Round.findById(roundId);
  if (!round) throw new NotFoundError('Round');

  if (!canManageBranch(req.user, round.branchId)) {
    throw new ForbiddenError('You do not have permission to manage this branch');
  }

  const { name, description, category, instructorIds, studentIds, adminId } =
    req.body;
  if (!name || !name.trim()) {
    throw new ValidationError('Track name is required');
  }

  const track = await Track.create({
    roundId: round._id,
    branchId: round.branchId,
    name: name.trim(),
    description: (description || '').trim(),
    category: TRACK_CATEGORIES.includes(category) ? category : 'Others',
    instructorIds: Array.isArray(instructorIds) ? instructorIds : [],
    studentIds: Array.isArray(studentIds) ? studentIds : [],
    adminId: adminId || null,
  });

  // Keep denormalized user.trackIds in sync
  const memberIds = [...new Set([...track.instructorIds, ...track.studentIds].map(String))];
  if (memberIds.length) {
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { trackIds: track._id } }
    );
  }

  return sendCreated(res, { track }, 'Track created successfully');
});

/**
 * Update a track (name, description, category, admin)
 * PATCH /courses/tracks/:id
 * @access Super Admin / Branch Admin (own branch) / Track admin
 */
const updateTrack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid track ID');
  }

  const track = await Track.findById(id);
  if (!track) throw new NotFoundError('Track');

  if (!canManageTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  const { name, description, category, adminId } = req.body;
  if (name !== undefined) track.name = name.trim();
  if (description !== undefined) track.description = description.trim();
  if (category !== undefined) {
    if (typeof category !== 'string' || !TRACK_CATEGORIES.includes(category)) {
      throw new ValidationError(
        `Invalid category. Allowed values: ${TRACK_CATEGORIES.join(', ')}`
      );
    }
    track.category = category;
  }
  if (adminId !== undefined) track.adminId = adminId || null;

  await track.save();
  return sendSuccess(res, { track }, 'Track updated successfully');
});

/**
 * Delete a track (cascades: removes its files, videos, chat messages,
 * item reviews and enrollments, and clears user.trackIds references)
 * DELETE /courses/tracks/:id
 * @access Super Admin / Branch Admin (own branch)
 */
const deleteTrack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid track ID');
  }

  const track = await Track.findById(id);
  if (!track) throw new NotFoundError('Track');

  if (!canManageBranch(req.user, track.branchId)) {
    throw new ForbiddenError('You do not have permission to delete this track');
  }

  await deleteTracksCascade([track._id]);

  return sendSuccess(res, null, 'Track deleted successfully');
});

/**
 * Assign / remove members on a track
 * PATCH /courses/tracks/:id/members
 * Body: { addInstructors?: [], removeInstructors?: [], addStudents?: [], removeStudents?: [] }
 * @access Super Admin / Branch Admin (own branch) / Track admin
 */
const updateTrackMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid track ID');
  }

  const track = await Track.findById(id);
  if (!track) throw new NotFoundError('Track');

  // Managers = branch admins / super admins / the track's assigned admin, PLUS
  // the track's own instructors (work order §5c — instructors may directly add
  // or remove members on the tracks they teach).
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  const {
    addInstructors = [],
    removeInstructors = [],
    addStudents = [],
    removeStudents = [],
  } = req.body;

  if (addInstructors.length) track.instructorIds.addToSet(...addInstructors);
  if (removeInstructors.length) track.instructorIds.pull(...removeInstructors);
  if (addStudents.length) track.studentIds.addToSet(...addStudents);
  if (removeStudents.length) track.studentIds.pull(...removeStudents);

  await track.save();

  // Sync denormalized user.trackIds
  const added = [...addInstructors, ...addStudents];
  const removed = [...removeInstructors, ...removeStudents];
  if (added.length) {
    await User.updateMany({ _id: { $in: added } }, { $addToSet: { trackIds: track._id } });
  }
  if (removed.length) {
    await User.updateMany({ _id: { $in: removed } }, { $pull: { trackIds: track._id } });
  }

  await track.populate([
    { path: 'instructorIds', select: USER_PUBLIC_FIELDS },
    { path: 'studentIds', select: USER_PUBLIC_FIELDS },
  ]);

  return sendSuccess(
    res,
    {
      track: {
        ...track.toObject(),
        studentCount: track.studentIds.length,
      },
    },
    'Track members updated successfully'
  );
});

/**
 * Get track members (instructors + students) for the settings modal
 * GET /courses/tracks/:id/members
 * @access Private (track members & managers)
 */
const getTrackMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid track ID');
  }

  const track = await Track.findById(id)
    .populate('instructorIds', USER_PUBLIC_FIELDS)
    .populate('studentIds', USER_PUBLIC_FIELDS)
    .populate('adminId', USER_PUBLIC_FIELDS)
    .lean();

  if (!track) throw new NotFoundError('Track');

  return sendSuccess(res, {
    instructors: track.instructorIds || [],
    students: track.studentIds || [],
    admin: track.adminId || null,
  });
});

/**
 * Search users for assignment dropdowns (instructors/students)
 * GET /tracks/users/search?role=instructor&q=...&branchId=...
 * @access Super Admin / Branch Admin / Instructor (own teaching branch)
 */
const searchAssignableUsers = asyncHandler(async (req, res) => {
  const { role, q = '', branchId } = req.query;

  if (!['instructor', 'student', 'branch_admin'].includes(role)) {
    throw new ValidationError('role must be one of: instructor, student, branch_admin');
  }

  // Role scoping of the branch filter (work order §5b/§5c):
  //  - branch admins search within their own branch only
  //  - instructors search within their assigned branch only
  //  - super admins may search any branch
  let effectiveBranchId = branchId;
  if (req.user.role === 'branch_admin' || req.user.role === 'instructor') {
    effectiveBranchId = req.user.branchId;
  }

  // "student" must also match the legacy "user" role — the platform treats
  // them identically, and exact-role matching is what made the old search
  // return nothing for valid candidates (work order §5b).
  const filter = {};
  if (role === 'student') {
    filter.role = { $in: ['student', 'user'] };
  } else {
    filter.role = role;
  }

  // A branch filter must not hide valid candidates that have no branch
  // assignment yet — include branch-less users alongside the branch's users.
  if (effectiveBranchId && mongoose.Types.ObjectId.isValid(effectiveBranchId)) {
    filter.$or = [
      { branchId: effectiveBranchId },
      { branchId: null },
    ];
  }
  if (q.trim()) {
    filter.$and = [
      {
        $or: [
          { username: { $regex: q.trim(), $options: 'i' } },
          { fullName: { $regex: q.trim(), $options: 'i' } },
        ],
      },
    ];
  }

  const users = await User.find(filter)
    .select(USER_PUBLIC_FIELDS)
    .sort({ fullName: 1 })
    .limit(30)
    .lean();

  return sendSuccess(res, { users });
});

module.exports = {
  listRoundTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  updateTrackMembers,
  getTrackMembers,
  searchAssignableUsers,
};