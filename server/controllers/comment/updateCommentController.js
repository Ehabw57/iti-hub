const Comment = require('../../models/Comment');
const { validateCommentUpdate, buildCommentResponse, canModifyComment } = require('../../utils/commentHelpers');

/**
 * Update a comment
 * @route PUT /comments/:id
 * @access Private
 */
async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user;

    // Validate updates
    const validation = validateCommentUpdate(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check authorization
    if (!canModifyComment(comment, user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment
    if (updates.content !== undefined) {
      comment.content = updates.content;
      comment.editedAt = new Date();
    }

    await comment.save();

    // Populate author details
    await comment.populate('author', 'username fullName profilePicture');

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: buildCommentResponse(comment, user)
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
}

module.exports = updateComment;
