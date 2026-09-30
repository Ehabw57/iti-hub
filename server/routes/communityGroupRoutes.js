const express = require('express');
const { checkAuth } = require('../middlewares/checkAuth');

const {
  listGroups,
  getGroup,
  createGroup,
  joinGroup,
  decideJoinRequest,
  cancelJoinRequest,
  listJoinRequests,
  getMyJoinRequests,
  leaveGroup,
  createPost,
  toggleLike,
  listComments,
  addComment,
} = require('../controllers/course/communityGroupController');

/**
 * Community routes — fully independent top-level section
 * (Specialization Groups, open to anyone regardless of branch).
 * Mounted at `/community`.
 *
 * NOTE: named communityGroupRoutes to avoid collision with the legacy
 * `communityRoutes.js` (mounted at `/communities`), which is a separate feature.
 */
const communityGroupRoutes = express.Router();

// ---- Specialization groups ----
communityGroupRoutes.get('/groups', checkAuth, listGroups);
communityGroupRoutes.post('/groups', checkAuth, createGroup);
communityGroupRoutes.get('/groups/my-join-requests', checkAuth, getMyJoinRequests);
communityGroupRoutes.get('/groups/:id', checkAuth, getGroup);
communityGroupRoutes.post('/groups/:id/join', checkAuth, joinGroup);
communityGroupRoutes.post('/groups/:id/leave', checkAuth, leaveGroup);

// ---- Group join-request moderation (request → admin decision) ----
// NOTE: static-ish segment paths are registered before '/groups/:id/join'
// sub-paths so Express doesn't capture "join-requests" as an :id.
communityGroupRoutes.get('/groups/:id/join-requests', checkAuth, listJoinRequests);
communityGroupRoutes.patch('/groups/join-requests/:id/decision', checkAuth, decideJoinRequest);
communityGroupRoutes.delete('/groups/join-requests/:id', checkAuth, cancelJoinRequest);

// ---- Group posts / likes / comments ----
communityGroupRoutes.post('/groups/:id/posts', checkAuth, createPost);
communityGroupRoutes.post('/groups/posts/:postId/like', checkAuth, toggleLike);
communityGroupRoutes.get('/groups/posts/:postId/comments', checkAuth, listComments);
communityGroupRoutes.post('/groups/posts/:postId/comments', checkAuth, addComment);

module.exports = communityGroupRoutes;
