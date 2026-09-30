const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Track = require('../models/Track');
const Round = require('../models/Round');
const User = require('../models/User');
const CourseFile = require('../models/CourseFile');
const CourseVideo = require('../models/CourseVideo');
const TrackChatMessage = require('../models/TrackChatMessage');
const TrackItemReview = require('../models/TrackItemReview');
const TrackRecord = require('../models/TrackRecord');
const TrackFolder = require('../models/TrackFolder');
const Enrollment = require('../models/Enrollment');
const EnrollmentRequest = require('../models/EnrollmentRequest');

/**
 * Cascade-delete helpers for the Branch → Round → Track hierarchy.
 *
 * Behavior (per product decision): deletion cascades downward and cleans up
 * every reference so no orphaned documents are left behind:
 *  - deleting a Track removes its files, videos, chat messages, item reviews
 *    and enrollments, and pulls the track id from every user's trackIds
 *  - deleting a Round cascades to all of its Tracks
 *  - deleting a Branch cascades to all of its Rounds (and their Tracks)
 *
 * Note: standalone MongoDB does not support multi-document transactions, so
 * the deletes run sequentially (same convention as the rest of the codebase).
 */

/**
 * Delete tracks and everything that references them.
 * @param {Array<string|mongoose.Types.ObjectId>} trackIds
 * @returns {Promise<number>} number of tracks removed
 */
async function deleteTracksCascade(trackIds) {
  const ids = trackIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  if (!ids.length) return 0;

  await Promise.all([
    CourseFile.deleteMany({ trackId: { $in: ids } }),
    CourseVideo.deleteMany({ trackId: { $in: ids } }),
    TrackChatMessage.deleteMany({ trackId: { $in: ids } }),
    TrackItemReview.deleteMany({ trackId: { $in: ids } }),
    TrackRecord.deleteMany({ trackId: { $in: ids } }),
    TrackFolder.deleteMany({ trackId: { $in: ids } }),
    Enrollment.deleteMany({ track_id: { $in: ids } }),
    EnrollmentRequest.deleteMany({ track_id: { $in: ids } }),
    // Keep denormalized user.trackIds in sync
    User.updateMany({ trackIds: { $in: ids } }, { $pull: { trackIds: { $in: ids } } }),
  ]);

  const result = await Track.deleteMany({ _id: { $in: ids } });
  return result.deletedCount;
}

/**
 * Delete rounds and cascade to their tracks.
 * @param {Array<string|mongoose.Types.ObjectId>} roundIds
 * @returns {Promise<{rounds: number, tracks: number}>}
 */
async function deleteRoundsCascade(roundIds) {
  const ids = roundIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  if (!ids.length) return { rounds: 0, tracks: 0 };

  const trackIds = await Track.find({ roundId: { $in: ids } })
    .select('_id')
    .lean()
    .then((docs) => docs.map((d) => d._id));

  const tracks = await deleteTracksCascade(trackIds);
  const result = await Round.deleteMany({ _id: { $in: ids } });

  return { rounds: result.deletedCount, tracks };
}

/**
 * Delete a branch and cascade to its rounds and tracks.
 * @param {string|mongoose.Types.ObjectId} branchId
 * @returns {Promise<{branches: number, rounds: number, tracks: number}>}
 */
async function deleteBranchCascade(branchId) {
  const id = new mongoose.Types.ObjectId(String(branchId));

  const roundIds = await Round.find({ branchId: id })
    .select('_id')
    .lean()
    .then((docs) => docs.map((d) => d._id));

  const { rounds, tracks } = await deleteRoundsCascade(roundIds);
  const result = await Branch.deleteOne({ _id: id });

  return { branches: result.deletedCount, rounds, tracks };
}

module.exports = {
  deleteTracksCascade,
  deleteRoundsCascade,
  deleteBranchCascade,
};
