const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant, canSendMessage, formatMessage } = require('../../utils/messageHelpers');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { MAX_MESSAGE_CONTENT_LENGTH } = require('../../utils/constants');
const { getSocketServer, getUserSocketId } = require('../../utils/socketServer');

/**
 * Send a message in a conversation
 * POST /conversations/:conversationId/messages
 * Supports text content and/or image upload via upload.message middleware
 */
exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    let { content } = req.body;
    const imageFile = req.file;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Trim content if provided
    if (content) {
      content = content.trim();
    }

    // Validate at least one of content or image is provided
    if ((!content || content.length === 0) && !imageFile) {
      return res.status(400).json({
        success: false,
        message: 'Message must have content or image'
      });
    }

    // Validate content length
    if (content && content.length > MAX_MESSAGE_CONTENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message content cannot exceed ${MAX_MESSAGE_CONTENT_LENGTH} characters`
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    const userIsParticipant = await isParticipant(conversationId, currentUserId);
    if (!userIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // For individual conversations, check blocking
    if (conversation.type === 'individual') {
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== currentUserId.toString()
      );

      if (otherParticipant) {
        const messageCheck = await canSendMessage(currentUserId, otherParticipant);
        if (!messageCheck.canSend) {
          return res.status(403).json({
            success: false,
            message: 'Cannot send message - blocked'
          });
        }
      }
    }
    // Note: Group conversations allow messaging even if participants have blocked each other

    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      try {
        const result = await uploadToCloudinary(imageFile.buffer, 'messages');
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Create message
    const messageData = {
      conversation: conversationId,
      sender: currentUserId,
      status: 'sent'
    };

    if (content && content.length > 0) {
      messageData.content = content;
    }

    if (imageUrl) {
      messageData.image = imageUrl;
    }

    const message = await Message.create(messageData);

    // Update conversation lastMessage
    conversation.lastMessage = message._id;

    // Increment unreadCount for all participants except sender
    for (const participantId of conversation.participants) {
      const participantIdString = participantId.toString();
      if (participantIdString !== currentUserId.toString()) {
        const currentCount = conversation.unreadCount.get(participantIdString) || 0;
        conversation.unreadCount.set(participantIdString, currentCount + 1);
      }
    }

    await conversation.save();

    // Populate sender details for response
    await message.populate('sender', 'username fullName profilePicture isOnline lastSeen');

    const formatted = formatMessage(message.toObject());

    // Emit real-time message to other participants
    try {
      const io = getSocketServer();
      if (io) {
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== currentUserId.toString()) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('message:new', {
                conversationId: conversationId,
                content: formatted.content,
                image: formatted.image,
                senderId: currentUserId.toString(),
                senderName: req.user.fullName || req.user.username,
                messageId: message._id.toString(),
                timestamp: message.createdAt
              });
            });
          }
        });
      }
    } catch (socketError) {
      // Log but don't fail the request if socket emission fails
      console.error('Error emitting message event:', socketError);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: formatted
      }
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: error.message
    });
  }
};
