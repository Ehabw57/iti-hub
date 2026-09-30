const Track = require('../models/Track');
const { ForbiddenError } = require('../utils/errors');

/**
 * Role helpers & middleware guards for the ITI hierarchy.
 *
 * Roles:
 *  - super_admin  : platform-wide management (legacy "admin" is treated the same)
 *  - branch_admin : management access scoped to their own branch (user.branchId)
 *  - instructor   : can upload content to their own tracks
 *  - student      : standard member
 *  - user         : legacy default role, treated as student-level
 */

const SUPER_ADMIN_ROLES = ['super_admin', 'admin'];
const ADMIN_ROLES = ['super_admin', 'admin', 'branch_admin'];

/**
 * Is the user a platform (super) admin?
 */
const isSuperAdmin = (user) =>
  !!user && SUPER_ADMIN_ROLES.includes(user.role);

/**
 * Is the user any admin-level role (super or branch admin)?
 */
const isAdminRole = (user) => !!user && ADMIN_ROLES.includes(user.role);

/**
 * Can the user manage (create/edit rounds & tracks for) a given branch?
 */
const canManageBranch = (user, branchId) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.role === 'branch_admin') {
    return (
      !!branchId &&
      !!user.branchId &&
      user.branchId.toString() === branchId.toString()
    );
  }
  return false;
};

/**
 * Can the user manage a given track document?
 * (super admin, branch admin of the track's branch, or the track's assigned admin)
 */
const canManageTrack = (user, track) => {
  if (!user || !track) return false;
  if (isSuperAdmin(user)) return true;
  if (
    user.role === 'branch_admin' &&
    track.branchId &&
    user.branchId &&
    user.branchId.toString() === track.branchId.toString()
  ) {
    return true;
  }
  if (track.adminId && track.adminId.toString() === user._id.toString()) {
    return true;
  }
  return false;
};

/**
 * Can the user upload files/videos to a track?
 * (managers + instructors assigned to the track)
 */
const canUploadToTrack = (user, track) => {
  if (!user || !track) return false;
  if (canManageTrack(user, track)) return true;
  if (user.role === 'instructor') {
    return (track.instructorIds || []).some(
      (id) => id.toString() === user._id.toString()
    );
  }
  return false;
};

/**
 * Is the user a member of the track (instructor, student, or manager)?
 */
const isTrackMember = (user, track) => {
  if (!user || !track) return false;
  if (canManageTrack(user, track)) return true;
  const id = user._id.toString();
  return (
    (track.instructorIds || []).some((i) => i.toString() === id) ||
    (track.studentIds || []).some((s) => s.toString() === id)
  );
};

/**
 * Can the user delete a chat message?
 * Managers of the track's branch can delete any message in their branch;
 * instructors/students can delete their own messages only.
 */
const canDeleteChatMessage = (user, track, message) => {
  if (!user || !message) return false;
  if (isSuperAdmin(user)) return true;
  if (message.senderId && message.senderId.toString() === user._id.toString()) {
    return true;
  }
  return canManageTrack(user, track);
};

/**
 * Middleware: require one of the given roles.
 * Usage: router.post('/x', checkAuth, requireRoles('super_admin'), handler)
 * Legacy "admin" counts as super_admin; legacy "user" counts as student.
 */
const requireRoles = (...roles) => {
  const expanded = new Set(roles);
  if (expanded.has('super_admin')) expanded.add('admin');
  if (expanded.has('student')) expanded.add('user');
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required', 'NOT_AUTHENTICATED'));
    }
    if (!expanded.has(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

/**
 * Middleware: load track from :trackId param and attach to req.track.
 * Throws 404 when missing.
 */
const loadTrack = async (req, res, next) => {
  try {
    const track = await Track.findById(req.params.trackId);
    if (!track) {
      return next(new ForbiddenError('Track not found', 'TRACK_NOT_FOUND'));
    }
    req.track = track;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware factory: require that the authenticated user can manage the
 * track loaded by loadTrack (must run after loadTrack).
 */
const requireTrackManager = (req, res, next) => {
  if (!canManageTrack(req.user, req.track)) {
    return next(new ForbiddenError('You do not have permission to manage this track'));
  }
  next();
};

/**
 * Middleware factory: require that the authenticated user can upload to the
 * track loaded by loadTrack (must run after loadTrack).
 */
const requireTrackUploader = (req, res, next) => {
  if (!canUploadToTrack(req.user, req.track)) {
    return next(new ForbiddenError('You do not have permission to upload to this track'));
  }
  next();
};

/**
 * Middleware factory: require that the authenticated user is a member of the
 * track loaded by loadTrack (must run after loadTrack).
 */
const requireTrackMember = (req, res, next) => {
  if (!isTrackMember(req.user, req.track)) {
    return next(new ForbiddenError('You are not a member of this track'));
  }
  next();
};

module.exports = {
  SUPER_ADMIN_ROLES,
  ADMIN_ROLES,
  isSuperAdmin,
  isAdminRole,
  canManageBranch,
  canManageTrack,
  canUploadToTrack,
  isTrackMember,
  canDeleteChatMessage,
  requireRoles,
  loadTrack,
  requireTrackManager,
  requireTrackUploader,
  requireTrackMember,
};