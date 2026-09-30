const mongoose = require('mongoose');
const CommunityGroup = require('../../models/CommunityGroup');
const GroupPost = require('../../models/GroupPost');
const GroupComment = require('../../models/GroupComment');
const GroupJoinRequest = require('../../models/GroupJoinRequest');
const Notification = require('../../models/Notification');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../../utils/errors');
const { sendSuccess, sendCreated } = require('../../utils/responseHelpers');
const { isSuperAdmin } = require('../../middlewares/checkRoles');
const { NOTIFICATION_TYPES } = require('../../utils/constants');

const USER_FIELDS = 'username fullName profilePicture role';

/**
 * List community groups (with member count + joined flag)
 * GET /courses/groups
 * @access Private
 */
const listGroups = asyncHandler(async (req, res) => {
  const groups = await CommunityGroup.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', USER_FIELDS)
    .lean();

  const userId = req.user._id.toString();

  // Pending join-request flag for the current user (one lookup for all groups)
  const pendingRequests = await GroupJoinRequest.find({
    user_id: req.user._id,
    status: 'pending',
  }).select('group_id').lean();
  const pendingGroupIds = new Set(pendingRequests.map((r) => String(r.group_id)));

  const groupsWithMeta = groups.map((g) => ({
    ...g,
    memberCount: (g.memberIds || []).length,
    isJoined: (g.memberIds || []).some((m) => m.toString() === userId),
    isPending: pendingGroupIds.has(String(g._id)),
    memberIds: undefined,
  }));

  return sendSuccess(res, { groups: groupsWithMeta });
});

/**
 * Get a single group with its posts
 * GET /courses/groups/:id
 * @access Private
 */
const getGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid group ID');

  const group = await CommunityGroup.findById(id)
    .populate('createdBy', USER_FIELDS)
    .lean();
  if (!group) throw new NotFoundError('Group');

  const userId = req.user._id.toString();
  const isJoined = (group.memberIds || []).some((m) => m.toString() === userId);
  const pendingRequest = await GroupJoinRequest.findOne({
    user_id: req.user._id,
    group_id: group._id,
    status: 'pending',
  })
    .select('_id')
    .lean();
  const isPending = !!pendingRequest;

  const posts = await GroupPost.find({ groupId: group._id })
    .sort({ createdAt: -1 })
    .populate('authorId', USER_FIELDS)
    .lean();

  const postsWithMeta = posts.map((p) => ({
    ...p,
    likeCount: (p.likes || []).length,
    isLiked: (p.likes || []).some((l) => l.toString() === userId),
    commentCount: 0,
    likes: undefined,
  }));

  const commentCounts = await GroupComment.aggregate([
    { $match: { postId: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));
  postsWithMeta.forEach((p) => {
    p.commentCount = countMap.get(String(p._id)) || 0;
  });

  return sendSuccess(res, {
    group: {
      ...group,
      memberCount: (group.memberIds || []).length,
      isJoined,
      isPending,
      memberIds: undefined,
    },
    posts: postsWithMeta,
  });
});

/**
 * Create a community group
 * POST /courses/groups
 * @access Private (any authenticated user becomes the group owner)
 */
const createGroup = asyncHandler(async (req, res) => {
  const { name, specialization, description, coverImage } = req.body;
  if (!name || !name.trim()) throw new ValidationError('Group name is required');
  if (!specialization || !specialization.trim()) {
    throw new ValidationError('Group specialization is required');
  }

  const group = await CommunityGroup.create({
    name: name.trim(),
    specialization: specialization.trim(),
    description: (description || '').trim(),
    coverImage: coverImage || null,
    createdBy: req.user._id,
    memberIds: [req.user._id],
  });

  return sendCreated(res, { group }, 'Group created successfully');
});

/**
 * Request to join a group (creates a pending request for admin review)
 * POST /community/groups/:id/join
 * @access Private
 */
const joinGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid group ID');

  const group = await CommunityGroup.findById(id);
  if (!group) throw new NotFoundError('Group');

  const userId = req.user._id;

  // Already a member — nothing to request
  const isMember = (group.memberIds || []).some(
    (m) => m.toString() === userId.toString()
  );
  if (isMember) {
    throw new ConflictError('You are already a member of this group');
  }

  // One pending request per user per group (unique partial index also guards this)
  const existingPending = await GroupJoinRequest.findOne({
    user_id: userId,
    group_id: group._id,
    status: 'pending',
  });
  if (existingPending) {
    throw new ConflictError('You already have a pending request for this group');
  }

  const request = await GroupJoinRequest.create({
    user_id: userId,
    group_id: group._id,
  });

  // Notify the group admin (fire-and-forget)
  if (group.createdBy) {
    try {
      await Notification.createOrUpdateNotification(
        group.createdBy,
        userId,
        NOTIFICATION_TYPES.GROUP_JOIN_REQUEST,
        group._id,
        group._id
      );
    } catch (e) {
      console.error('Failed to notify group admin of join request:', e.message);
    }
  }

  return sendCreated(
    res,
    { request: { _id: request._id, status: request.status } },
    'Join request sent — waiting for admin approval'
  );
});

/**
 * Approve or reject a join request (group admin / super admin)
 * PATCH /community/groups/join-requests/:id/decision
 * @access Private (group creator or super admin)
 */
const decideJoinRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid request ID');
  if (!['approved', 'rejected'].includes(decision)) {
    throw new ValidationError('decision must be "approved" or "rejected"');
  }

  const request = await GroupJoinRequest.findById(id);
  if (!request) throw new NotFoundError('Join request');

  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  const group = await CommunityGroup.findById(request.group_id);
  if (!group) throw new NotFoundError('Group');

  // Reviewers: the group's creator (admin) or a super admin
  const isGroupAdmin = String(group.createdBy) === String(req.user._id);
  if (!isGroupAdmin && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('Only the group admin can review join requests');
  }

  if (decision === 'approved') {
    group.memberIds.addToSet(request.user_id);
    await group.save();
  }

  request.status = decision;
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  await request.save();

  await request.populate('user_id', USER_FIELDS);

  // Notify the requester about the decision (fire-and-forget)
  try {
    await Notification.createOrUpdateNotification(
      request.user_id._id,
      req.user._id,
      decision === 'approved'
        ? NOTIFICATION_TYPES.GROUP_JOIN_APPROVED
        : NOTIFICATION_TYPES.GROUP_JOIN_REJECTED,
      group._id,
      group._id
    );
  } catch (e) {
    console.error('Failed to notify requester of join decision:', e.message);
  }

  return sendSuccess(
    res,
    {
      request: {
        _id: request._id,
        status: request.status,
        requester: request.user_id,
        decidedAt: request.decidedAt,
      },
    },
    decision === 'approved'
      ? 'Join request approved'
      : 'Join request rejected'
  );
});

/**
 * Cancel a pending join request (by the requester)
 * DELETE /community/groups/join-requests/:id
 * @access Private (request owner)
 */
const cancelJoinRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid request ID');

  const request = await GroupJoinRequest.findById(id);
  if (!request) throw new NotFoundError('Join request');

  if (request.user_id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only cancel your own requests');
  }
  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  await GroupJoinRequest.findByIdAndDelete(id);
  return sendSuccess(res, { cancelled: true }, 'Join request cancelled');
});

/**
 * List a group's join requests (admin review queue)
 * GET /community/groups/:id/join-requests?status=pending|approved|rejected|all
 * @access Private (group creator or super admin)
 */
const listJoinRequests = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'pending' } = req.query;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid group ID');

  const group = await CommunityGroup.findById(id);
  if (!group) throw new NotFoundError('Group');

  const isGroupAdmin = String(group.createdBy) === String(req.user._id);
  if (!isGroupAdmin && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('Only the group admin can view join requests');
  }

  const query = { group_id: group._id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const requests = await GroupJoinRequest.find(query)
    .populate('user_id', USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map((r) => ({
    _id: r._id,
    status: r.status,
    requester: r.user_id,
    requestedAt: r.createdAt,
    decidedAt: r.decidedAt,
  }));

  return sendSuccess(res, { requests: data }, null, 200, { total: data.length });
});

/**
 * Get the authenticated user's own join requests (all statuses)
 * GET /community/groups/my-join-requests
 * @access Private
 */
const getMyJoinRequests = asyncHandler(async (req, res) => {
  const requests = await GroupJoinRequest.find({ user_id: req.user._id })
    .populate('group_id', 'name specialization')
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map((r) => ({
    _id: r._id,
    status: r.status,
    group: r.group_id,
    requestedAt: r.createdAt,
    decidedAt: r.decidedAt,
  }));

  return sendSuccess(res, { requests: data }, null, 200, { total: data.length });
});

/**
 * Leave a group
 * POST /courses/groups/:id/leave
 * @access Private
 */
const leaveGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid group ID');

  const group = await CommunityGroup.findById(id);
  if (!group) throw new NotFoundError('Group');

  group.memberIds.pull(req.user._id);
  await group.save();

  return sendSuccess(res, { memberCount: group.memberIds.length, isJoined: false }, 'Left group');
});

/**
 * Create a post in a group
 * POST /courses/groups/:id/posts
 * @access Private (members only)
 */
const createPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid group ID');

  const group = await CommunityGroup.findById(id);
  if (!group) throw new NotFoundError('Group');

  const isMember = group.memberIds.some((m) => m.toString() === req.user._id.toString());
  if (!isMember && !isSuperAdmin(req.user)) {
    throw new ForbiddenError('You must join this group to post');
  }

  const { content } = req.body;
  if (!content || !content.trim()) throw new ValidationError('Post content is required');

  const post = await GroupPost.create({
    groupId: group._id,
    authorId: req.user._id,
    content: content.trim(),
  });

  await post.populate('authorId', USER_FIELDS);

  return sendCreated(res, { post }, 'Post created');
});

/**
 * Toggle like on a group post
 * POST /courses/groups/posts/:postId/like
 * @access Private
 */
const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ValidationError('Invalid post ID');

  const post = await GroupPost.findById(postId);
  if (!post) throw new NotFoundError('Post');

  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((l) => l.toString() === userId);

  if (alreadyLiked) {
    post.likes.pull(req.user._id);
  } else {
    post.likes.addToSet(req.user._id);
  }
  await post.save();

  return sendSuccess(res, {
    isLiked: !alreadyLiked,
    likeCount: post.likes.length,
  }, alreadyLiked ? 'Like removed' : 'Post liked');
});

/**
 * List comments on a post
 * GET /courses/groups/posts/:postId/comments
 * @access Private
 */
const listComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ValidationError('Invalid post ID');

  const comments = await GroupComment.find({ postId })
    .sort({ createdAt: 1 })
    .populate('authorId', USER_FIELDS)
    .lean();

  return sendSuccess(res, { comments });
});

/**
 * Add a comment to a post
 * POST /courses/groups/posts/:postId/comments
 * @access Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ValidationError('Invalid post ID');

  const post = await GroupPost.findById(postId);
  if (!post) throw new NotFoundError('Post');

  const { content } = req.body;
  if (!content || !content.trim()) throw new ValidationError('Comment content is required');

  const comment = await GroupComment.create({
    postId: post._id,
    authorId: req.user._id,
    content: content.trim(),
  });

  // Increment denormalized comment counter on the post
  await GroupPost.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

  await comment.populate('authorId', USER_FIELDS);

  return sendCreated(res, { comment }, 'Comment added');
});

module.exports = {
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
};
