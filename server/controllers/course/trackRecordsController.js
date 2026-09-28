const mongoose = require('mongoose');
const TrackRecord = require('../../models/TrackRecord');
const TrackFolder = require('../../models/TrackFolder');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { canUploadToTrack } = require('../../middlewares/checkRoles');

const CREATOR_FIELDS = 'username fullName profilePicture role';

/**
 * Resolve the optional folderId from the request body. Must be either null
 * (root) or a valid ObjectId of a 'records'-kind folder belonging to the
 * same track. Throws a ValidationError otherwise so managers can't
 * cross-assign folders between the Records and Files tabs.
 */
async function resolveFolderId(trackId, folderId) {
  if (folderId === undefined || folderId === null || folderId === '') {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(String(folderId))) {
    throw new ValidationError('Invalid folder ID');
  }
  const folder = await TrackFolder.findById(folderId);
  // Records may only live in 'records'-kind folders of the same track — the
  // Records tab's folder list is fully independent of the Files tab's.
  if (
    !folder ||
    String(folder.trackId) !== String(trackId) ||
    (folder.kind || 'files') !== 'records'
  ) {
    throw new ValidationError("Folder does not belong to this track's records");
  }
  return folder._id;
}

/**
 * Track records — session recordings / Teams meeting links shown in the
 * workspace "Records" tab. Track members read; track managers create,
 * update and delete.
 */

/**
 * List records for a track
 * GET /tracks/:trackId/records
 * @access Private (track members)
 */
const listRecords = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const records = await TrackRecord.find({ trackId })
    .sort({ sessionDate: -1, createdAt: -1 })
    .populate('createdBy', CREATOR_FIELDS)
    .lean();
  return sendSuccess(res, { records });
});

/**
 * Create a record for a track
 * POST /tracks/:trackId/records
 * Body: { title, teamsUrl, description?, sessionDate?, thumbnail? }
 * @access Private (track instructors + managers)
 */
const createRecord = asyncHandler(async (req, res) => {
  const track = req.track;
  const { title, teamsUrl, description, sessionDate, thumbnail, folderId } = req.body;

  if (!title || !title.trim()) throw new ValidationError('Record title is required');
  if (!teamsUrl || !teamsUrl.trim()) throw new ValidationError('Teams URL is required');

  const resolvedFolderId = await resolveFolderId(track._id, folderId);

  const record = await TrackRecord.create({
    trackId: track._id,
    title: title.trim(),
    teamsUrl: teamsUrl.trim(),
    thumbnail: thumbnail ? thumbnail.trim() : null,
    description: (description || '').trim(),
    sessionDate: sessionDate ? new Date(sessionDate) : null,
    folderId: resolvedFolderId,
    createdBy: req.user._id,
  });

  await record.populate('createdBy', CREATOR_FIELDS);

  return sendCreated(res, { record }, 'Record added successfully');
});

/**
 * Update a record
 * PATCH /tracks/records/:id
 * Body: { title?, teamsUrl?, description?, sessionDate?, thumbnail? }
 * @access Private (track instructors + managers)
 */
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid record ID');

  const record = await TrackRecord.findById(id);
  if (!record) throw new NotFoundError('Record');

  const track = req.track || (await require('../../models/Track').findById(record.trackId));
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  const { title, teamsUrl, description, sessionDate, thumbnail, folderId } = req.body;
  if (title !== undefined) {
    if (!title || !title.trim()) throw new ValidationError('Record title is required');
    record.title = title.trim();
  }
  if (teamsUrl !== undefined) {
    if (!teamsUrl || !teamsUrl.trim()) throw new ValidationError('Teams URL is required');
    record.teamsUrl = teamsUrl.trim();
  }
  if (thumbnail !== undefined) record.thumbnail = thumbnail ? thumbnail.trim() : null;
  if (description !== undefined) record.description = (description || '').trim();
  if (sessionDate !== undefined) record.sessionDate = sessionDate ? new Date(sessionDate) : null;
  if (folderId !== undefined) {
    record.folderId = await resolveFolderId(record.trackId, folderId);
  }

  await record.save();
  await record.populate('createdBy', CREATOR_FIELDS);

  return sendSuccess(res, { record }, 'Record updated successfully');
});

/**
 * Delete a record
 * DELETE /tracks/records/:id
 * @access Private (track instructors + managers)
 */
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid record ID');

  const record = await TrackRecord.findById(id);
  if (!record) throw new NotFoundError('Record');

  const track = req.track || (await require('../../models/Track').findById(record.trackId));
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  await TrackRecord.findByIdAndDelete(id);
  return sendNoContent(res);
});

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};