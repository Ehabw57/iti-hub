const Comment = require('../../models/Comment');
const { validateCommentUpdate, buildCommentResponse, canModifyComment } = require('../../utils/commentHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Update a comment
 * @route PUT /comments/:id
 * @access Private
 */
const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = req.user;

  // Validate updates
  const validation = validateCommentUpdate(updates);
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }

  // Find comment
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  // Check authorization
  if (!canModifyComment(comment, user)) {
    throw new ForbiddenError('Not authorized to update this comment');
  }

  // Update comment
  if (updates.content !== undefined) {
    comment.content = updates.content;
    comment.editedAt = new Date();
  }

  await comment.save();

  // Populate author details
  await comment.populate('author', 'username fullName profilePicture');

  return sendSuccess(
    res,
    { comment: buildCommentResponse(comment, user) },
    'Comment updated successfully'
  );
});

module.exports = updateComment;
