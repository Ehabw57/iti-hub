const mongoose = require('mongoose');
const CourseFile = require('../../models/CourseFile');
const CourseVideo = require('../../models/CourseVideo');
const Track = require('../../models/Track');
const TrackFolder = require('../../models/TrackFolder');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { isSuperAdmin, canManageTrack } = require('../../middlewares/checkRoles');
const { deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { saveFile, absoluteUrl, deleteLocalFile } = require('../../utils/fileStorage');

const UPLOADER_FIELDS = 'username fullName profilePicture';

/**
 * Fire-and-forget realtime notification to track members.
 * Kept non-blocking; failures are logged only.
 */
function notifyTrackMembers(track, actor, type, targetId, label) {
  try {
    const { emitToUsers } = require('../../utils/socketServer');
    const memberIds = [...new Set([...(track.instructorIds || []), ...(track.studentIds || [])].map(String))]
      .filter((id) => id !== actor._id.toString());
    emitToUsers(memberIds, 'track:activity', {
      trackId: String(track._id),
      type,
      targetId: String(targetId),
      label,
      actor: { _id: String(actor._id), fullName: actor.fullName, username: actor.username },
      timestamp: new Date(),
    });
  } catch (e) {
    console.error('Failed to notify track members:', e.message);
  }
}

/**
 * List files for a track
 * GET /courses/tracks/:trackId/files
 * @access Private (track members)
 */
const listFiles = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const files = await CourseFile.find({ trackId })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', UPLOADER_FIELDS)
    .lean();
  return sendSuccess(res, { files });
});

/**
 * Upload a file to a track (multipart field "file", optional "isShared")
 * POST /courses/tracks/:trackId/files
 * @access Super Admin / Branch Admin / Instructor (own tracks)
 */
const uploadFile = asyncHandler(async (req, res) => {
  const track = req.track;

  if (!req.file) {
    throw new ValidationError('A file is required');
  }

  const originalName = req.file.originalname || 'file';
  const ext = (originalName.split('.').pop() || '').toLowerCase();

  // Upload to Cloudinary when configured, local disk otherwise.
  // (Previously hard-failed with 503 FILE_STORAGE_NOT_CONFIGURED when
  // credentials were absent — the fallback keeps the flow working.)
  const result = await saveFile(req.file.buffer, {
    folder: `iti-hub/tracks/${track._id}/files`,
    originalName,
    resourceType: 'raw',
    useFilename: true,
  });
  const fileUrl = absoluteUrl(req, result.url);

  // Uploads may only land in 'files'-kind folders of the same track — the
  // Files tab's folder list is fully independent of the Records tab's.
  let folderId = null;
  if (req.body.folderId) {
    if (!mongoose.Types.ObjectId.isValid(String(req.body.folderId))) {
      throw new ValidationError('Invalid folder ID');
    }
    const folder = await TrackFolder.findById(req.body.folderId);
    if (
      !folder ||
      String(folder.trackId) !== String(track._id) ||
      (folder.kind || 'files') !== 'files'
    ) {
      throw new ValidationError("Folder does not belong to this track's files");
    }
    folderId = folder._id;
  }

  const courseFile = await CourseFile.create({
    trackId: track._id,
    uploadedBy: req.user._id,
    fileName: originalName,
    fileUrl,
    fileType: ext,
    sizeInBytes: req.file.size || 0,
    isShared: req.body.isShared === 'true' || req.body.isShared === true,
    folderId,
  });

  await courseFile.populate('uploadedBy', UPLOADER_FIELDS);

  // Notify track members about the new file (fire-and-forget)
  notifyTrackMembers(track, req.user, 'new_file', courseFile._id, courseFile.fileName);

  return sendCreated(res, { file: courseFile }, 'File uploaded successfully');
});

/**
 * Delete a file
 * DELETE /courses/files/:id
 * @access Super Admin / track managers / uploader (own uploads)
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid file ID');

  const file = await CourseFile.findById(id);
  if (!file) throw new NotFoundError('File');

  const track = await Track.findById(file.trackId);
  const isUploader = file.uploadedBy.toString() === req.user._id.toString();
  if (!isUploader && !canManageTrack(req.user, track) && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('You can only delete your own uploads');
  }

  // Best-effort remote deletion (Cloudinary) and local-disk cleanup
  try {
    const publicId = extractPublicId(file.fileUrl);
    if (publicId) await deleteFromCloudinary(publicId);
  } catch (e) {
    // ignore storage errors; the record is removed regardless
  }
  await deleteLocalFile(file.fileUrl).catch(() => {});

  await CourseFile.findByIdAndDelete(id);
  return sendNoContent(res);
});

/**
 * List videos for a track
 * GET /courses/tracks/:trackId/videos
 * @access Private (track members)
 */
const listVideos = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const videos = await CourseVideo.find({ trackId })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', UPLOADER_FIELDS)
    .lean();
  return sendSuccess(res, { videos });
});

/**
 * Add a video to a track
 * POST /courses/tracks/:trackId/videos
 * Body: { title, videoUrl, description?, thumbnailUrl?, durationSeconds? }
 * @access Super Admin / Branch Admin / Instructor (own tracks)
 */
const addVideo = asyncHandler(async (req, res) => {
  const track = req.track;
  const { title, videoUrl, description, thumbnailUrl, durationSeconds } = req.body;

  if (!title || !title.trim()) throw new ValidationError('Video title is required');
  if (!videoUrl || !videoUrl.trim()) throw new ValidationError('Video URL is required');

  const video = await CourseVideo.create({
    trackId: track._id,
    uploadedBy: req.user._id,
    title: title.trim(),
    description: (description || '').trim(),
    videoUrl: videoUrl.trim(),
    thumbnailUrl: thumbnailUrl || null,
    durationSeconds: durationSeconds || null,
  });

  await video.populate('uploadedBy', UPLOADER_FIELDS);

  notifyTrackMembers(track, req.user, 'new_video', video._id, video.title);

  return sendCreated(res, { video }, 'Video added successfully');
});

/**
 * Delete a video
 * DELETE /courses/videos/:id
 * @access Super Admin / track managers / uploader (own uploads)
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid video ID');

  const video = await CourseVideo.findById(id);
  if (!video) throw new NotFoundError('Video');

  const track = await Track.findById(video.trackId);
  const isUploader = video.uploadedBy.toString() === req.user._id.toString();
  if (!isUploader && !canManageTrack(req.user, track) && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('You can only delete your own uploads');
  }

  await CourseVideo.findByIdAndDelete(id);
  return sendNoContent(res);
});

/**
 * Shared Resource Library — files tagged "shared" from same-named tracks
 * across all branches/rounds.
 * GET /courses/tracks/:trackId/shared-resources
 * @access Private (track members)
 */
const listSharedResources = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(trackId)) throw new ValidationError('Invalid track ID');

  const track = await Track.findById(trackId).lean();
  if (!track) throw new NotFoundError('Track');

  // Find all tracks with the same name (any branch/round)
  const siblingTracks = await Track.find({ name: track.name }).select('_id').lean();
  const siblingIds = siblingTracks.map((t) => t._id);

  const files = await CourseFile.find({ trackId: { $in: siblingIds }, isShared: true })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', UPLOADER_FIELDS)
    .lean();

  return sendSuccess(res, { files });
});

module.exports = {
  listFiles,
  uploadFile,
  deleteFile,
  listVideos,
  addVideo,
  deleteVideo,
  listSharedResources,
};