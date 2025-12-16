const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { 
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH
} = require('../../utils/constants');

/**
 * Update group conversation details (admin only)
 * PUT /conversations/:conversationId
 * Supports updating name and/or image
 */
exports.updateGroup = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    let { name } = req.body;
    const imageFile = req.file;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Check if at least one update is provided
    if (!name && !imageFile) {
      return res.status(400).json({
        success: false,
        message: 'Provide name or image to update'
      });
    }

    // Trim and validate name if provided
    if (name) {
      name = name.trim();

      if (name.length < MIN_GROUP_NAME_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Group name must be at least ${MIN_GROUP_NAME_LENGTH} characters`
        });
      }

      if (name.length > MAX_GROUP_NAME_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Group name cannot exceed ${MAX_GROUP_NAME_LENGTH} characters`
        });
      }
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation is a group
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Can only update group conversations'
      });
    }

    // Check if current user is admin
    if (conversation.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update group details'
      });
    }

    // Update name if provided
    if (name) {
      conversation.name = name;
    }

    // Upload and update image if provided
    if (imageFile) {
      try {
        const result = await uploadToCloudinary(imageFile.buffer, 'groups');
        conversation.image = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    await conversation.save();

    // Format and return updated conversation
    const formatted = await formatConversation(conversation, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: {
        conversation: formatted
      }
    });
  } catch (error) {
    console.error('Error in updateGroup:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating group',
      error: error.message
    });
  }
};
