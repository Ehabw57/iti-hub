const mongoose = require('mongoose');
const TrackFolder = require('../../models/TrackFolder');
const CourseFile = require('../../models/CourseFile');
const TrackRecord = require('../../models/TrackRecord');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { canUploadToTrack } = require('../../middlewares/checkRoles');

const CREATOR_FIELDS = 'username fullName profilePicture role';

/**
 * Track folders — named groupings scoped to one workspace tab: kind 'files'
 * (Files tab) or 'records' (Records tab). Managers create/rename/delete
 * folders inside their tab; content is only ever assigned a same-kind
 * folder (see trackContentController.uploadFile and trackRecordsController).
 */

/**
 * List a track's folders for one tab (?kind=files|records, default files),
 * each with its content count for that tab
 * GET /tracks/:trackId/folders?kind=records
 * @access Private (track members)
 */
const listFolders = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  // Folder lists are per-tab: ?kind=files (default) or ?kind=records.
  const kind = req.query.kind === 'records' ? 'records' : 'files';

  const folders = await TrackFolder.find({ trackId, kind })
    .sort({ name: 1 })
    .populate('createdBy', CREATOR_FIELDS)
    .lean();

  // Count the requesting tab's content only; the other tab's count is 0.
  const trackObjectId = new mongoose.Types.ObjectId(trackId);
  const counts = await (kind === 'files' ? CourseFile : TrackRecord).aggregate([
    { $match: { trackId: trackObjectId, folderId: { $ne: null } } },
    { $group: { _id: '$folderId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return sendSuccess(res, {
    folders: folders.map((f) => ({
      ...f,
      fileCount: kind === 'files' ? countMap.get(String(f._id)) || 0 : 0,
      recordCount: kind === 'records' ? countMap.get(String(f._id)) || 0 : 0,
    })),
  });
});

/**
 * Create a folder in a track (scoped to one tab)
 * POST /tracks/:trackId/folders
 * Body: { name, kind? }  (kind: 'files' | 'records', default 'files')
 * @access Private (track managers)
 */
const createFolder = asyncHandler(async (req, res) => {
  const track = req.track;
  const { name, kind } = req.body;
  // Folder lists are per-tab; anything but 'records' means 'files'.
  const folderKind = kind === 'records' ? 'records' : 'files';

  if (!name || !name.trim()) throw new ValidationError('Folder name is required');

  const existing = await TrackFolder.findOne({
    trackId: track._id,
    kind: folderKind,
    name: name.trim(),
  });
  if (existing) {
    throw new ConflictError('A folder with this name already exists in this track');
  }

  const folder = await TrackFolder.create({
    trackId: track._id,
    kind: folderKind,
    name: name.trim(),
    createdBy: req.user._id,
  });

  await folder.populate('createdBy', CREATOR_FIELDS);

  return sendCreated(res, { folder }, 'Folder created successfully');
});

/**
 * Rename a folder
 * PATCH /tracks/folders/:id
 * Body: { name }
 * @access Private (track managers)
 */
const updateFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid folder ID');
  if (!name || !name.trim()) throw new ValidationError('Folder name is required');

  const folder = await TrackFolder.findById(id);
  if (!folder) throw new NotFoundError('Folder');

  const track = req.track || (await require('../../models/Track').findById(folder.trackId));
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  // Uniqueness is scoped to the folder's own tab (kind)
  const clash = await TrackFolder.findOne({
    trackId: folder.trackId,
    kind: folder.kind || 'files',
    name: name.trim(),
    _id: { $ne: id },
  });
  if (clash) {
    throw new ConflictError('A folder with this name already exists in this track');
  }

  folder.name = name.trim();
  await folder.save();
  await folder.populate('createdBy', CREATOR_FIELDS);

  return sendSuccess(res, { folder }, 'Folder updated successfully');
});

/**
 * Delete a folder — files inside it are kept and moved back to the track root
 * DELETE /tracks/folders/:id
 * @access Private (track managers)
 */
const deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid folder ID');

  const folder = await TrackFolder.findById(id);
  if (!folder) throw new NotFoundError('Folder');

  const track = req.track || (await require('../../models/Track').findById(folder.trackId));
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to manage this track');
  }

  // Move files and records back to the root rather than deleting them
  await CourseFile.updateMany({ folderId: folder._id }, { $set: { folderId: null } });
  await TrackRecord.updateMany({ folderId: folder._id }, { $set: { folderId: null } });
  await TrackFolder.findByIdAndDelete(id);

  return sendNoContent(res);
});

module.exports = {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
};