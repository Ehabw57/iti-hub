const express = require('express');
const { checkAuth, optionalAuth } = require('../middlewares/checkAuth');
const { requireRoles, loadTrack, requireTrackUploader, requireTrackMember, requireTrackManager } = require('../middlewares/checkRoles');
const upload = require('../middlewares/upload');

// Track catalog / detail
const listTracks = require('../controllers/course/listTracksController');
const getTrack = require('../controllers/course/getTrackController');

// Enrollments (request → approve/reject flow)
const {
  createEnrollmentRequest,
  decideEnrollmentRequest,
  cancelEnrollmentRequest,
  getMyEnrollmentRequests,
  listTrackEnrollmentRequests,
  listAllEnrollmentRequests,
} = require('../controllers/course/enrollmentRequestController');
const getMyEnrollments = require('../controllers/course/getMyEnrollmentsController');
const checkEnrollment = require('../controllers/course/checkEnrollmentController');

// Track admin
const {
  updateTrack,
  deleteTrack,
  updateTrackMembers,
  getTrackMembers,
  searchAssignableUsers,
} = require('../controllers/course/trackAdminController');

// Track content (files / videos / shared)
const {
  listFiles,
  uploadFile,
  deleteFile,
  listVideos,
  addVideo,
  deleteVideo,
  listSharedResources,
} = require('../controllers/course/trackContentController');

// Track folders (file groupings)
const {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} = require('../controllers/course/trackFoldersController');

// Track records (session / Teams links)
const {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} = require('../controllers/course/trackRecordsController');

// Track chat
const {
  listChatMessages,
  sendChatMessage,
  deleteChatMessage,
} = require('../controllers/course/trackChatController');

// Track progress / leaderboard
const {
  toggleReview,
  getMyReviews,
  getLeaderboard,
} = require('../controllers/course/trackProgressController');

/**
 * Track routes — the "courses system" lives at the Track level
 * (files, videos, chat, progress, leaderboard, records, enrollment).
 * Mounted at `/tracks`.
 */
const trackRoutes = express.Router();

// ---- Track catalog ----
trackRoutes.get('/', listTracks);

// ---- Enrollments (static paths MUST be registered before '/:id') ----
trackRoutes.get('/my-enrollments', checkAuth, getMyEnrollments);
trackRoutes.get('/my-enroll-requests', checkAuth, getMyEnrollmentRequests);
trackRoutes.get('/check-enrollment', checkAuth, checkEnrollment);
// Global role-scoped review queue (admin panel): super admin → all requests,
// branch admin → own branch's tracks, instructor → own tracks.
trackRoutes.get('/enroll-requests', checkAuth, requireRoles('super_admin', 'branch_admin', 'instructor'), listAllEnrollmentRequests);
trackRoutes.post('/enroll-requests', checkAuth, createEnrollmentRequest);
trackRoutes.patch('/enroll-requests/:id/decision', checkAuth, decideEnrollmentRequest);
trackRoutes.delete('/enroll-requests/:id', checkAuth, cancelEnrollmentRequest);

// ---- User search for member assignment ----
// Instructors need this too (work order §5c: direct-add scoped to their own
// teaching branches); the controller applies per-role branch scoping itself.
trackRoutes.get('/users/search', checkAuth, requireRoles('super_admin', 'branch_admin', 'instructor'), searchAssignableUsers);

// ---- Track detail / admin ----
trackRoutes.get('/:id', optionalAuth, getTrack);
trackRoutes.patch('/:id', checkAuth, updateTrack);
trackRoutes.delete('/:id', checkAuth, deleteTrack);
trackRoutes.get('/:id/members', checkAuth, getTrackMembers);
trackRoutes.patch('/:id/members', checkAuth, updateTrackMembers);

// ---- Enrollment request review queue (track managers) ----
trackRoutes.get('/:trackId/enroll-requests', checkAuth, loadTrack, listTrackEnrollmentRequests);

// ---- Track content (files / videos / shared) ----
trackRoutes.get('/:trackId/files', checkAuth, loadTrack, requireTrackMember, listFiles);
trackRoutes.post('/:trackId/files', checkAuth, loadTrack, requireTrackUploader, upload.trackFile, uploadFile);
trackRoutes.delete('/files/:id', checkAuth, deleteFile);
trackRoutes.get('/:trackId/videos', checkAuth, loadTrack, requireTrackMember, listVideos);
trackRoutes.post('/:trackId/videos', checkAuth, loadTrack, requireTrackUploader, addVideo);
trackRoutes.delete('/videos/:id', checkAuth, deleteVideo);
trackRoutes.get('/:trackId/shared-resources', checkAuth, loadTrack, requireTrackMember, listSharedResources);

// ---- Track folders (instructor + manager CRUD) ----
trackRoutes.get('/:trackId/folders', checkAuth, loadTrack, requireTrackMember, listFolders);
trackRoutes.post('/:trackId/folders', checkAuth, loadTrack, requireTrackUploader, createFolder);
trackRoutes.patch('/folders/:id', checkAuth, updateFolder);
trackRoutes.delete('/folders/:id', checkAuth, deleteFolder);

// ---- Track records (Teams links; instructor + manager CRUD) ----
trackRoutes.get('/:trackId/records', checkAuth, loadTrack, requireTrackMember, listRecords);
trackRoutes.post('/:trackId/records', checkAuth, loadTrack, requireTrackUploader, createRecord);
trackRoutes.patch('/records/:id', checkAuth, updateRecord);
trackRoutes.delete('/records/:id', checkAuth, deleteRecord);

// ---- Track chat ----
trackRoutes.get('/:trackId/chat', checkAuth, loadTrack, requireTrackMember, listChatMessages);
trackRoutes.post('/:trackId/chat', checkAuth, loadTrack, requireTrackMember, sendChatMessage);
trackRoutes.delete('/chat/:id', checkAuth, deleteChatMessage);

// ---- Track progress / leaderboard ----
trackRoutes.post('/:trackId/reviews', checkAuth, loadTrack, requireTrackMember, toggleReview);
trackRoutes.get('/:trackId/my-reviews', checkAuth, loadTrack, requireTrackMember, getMyReviews);
trackRoutes.get('/:trackId/leaderboard', checkAuth, loadTrack, requireTrackMember, getLeaderboard);

module.exports = trackRoutes;
