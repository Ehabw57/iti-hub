const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Connection = require("../models/Connection");

// GET /conversations → getConversations
async function getConversations(req, res) {
  try {

    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format"
      });
    }

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "first_name last_name email profile_pic")
      .populate({
        path: "last_message",
        select: "content createdAt sender_id",
        populate: {
          path: "sender_id",
          select: "first_name last_name"
        }
      })
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      participants: conv.participants.map(p => p._id),
      lastMessage: conv.last_message?.content || null,
      lastMessageTime: conv.last_message?.createdAt || conv.createdAt,
      lastMessageSender: conv.last_message?.sender_id || null
    }));

    res.status(200).json({
      success: true,
      data: formattedConversations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Error fetching conversations",
      details: err.message
    });
  }
}

// POST /conversations → createConversation
async function createConversation(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    let { participants } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Participants are required"
      });
    }

    // Add current user to participants if not included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Remove duplicates
    participants = [...new Set(participants)];

    // Validate participant count (conversation model requires exactly 2 participants)
    if (participants.length !== 2) {
      return res.status(400).json({
        success: false,
        error: "A conversation must have exactly 2 participants"
      });
    }

    // Validate all participant IDs
    for (const participantId of participants) {
      if (!mongoose.Types.ObjectId.isValid(participantId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid participant ID format"
        });
      }
    }

    // Check if all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(400).json({
        success: false,
        error: "One or more participants do not exist"
      });
    }
    
    // Check if conversation with same participants already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length }
    }).populate("participants", "first_name last_name email profile_pic");

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: {
          id: existingConversation._id,
          participants: existingConversation.participants.map(p => p._id),
          createdAt: existingConversation.createdAt
        }
      });
    }

    // Check if participants are connected
    // const otherParticipant = participants.find(id => id !== userId);
    // const connection = await Connection.findOne({
    //   $or: [
    //     { user_id: userId, connected_user_id: otherParticipant, status: 'accepted' },
    //     { user_id: otherParticipant, connected_user_id: userId, status: 'accepted' }
    //   ]
    // });

    // if (!connection) {
    //   return res.status(403).json({
    //     success: false,
    //     error: "Participants are not connected or blocked"
    //   });
    // }


    // Create new conversation
    const newConversation = new Conversation({
      participants: participants
    });

    await newConversation.save();
    await newConversation.populate("participants", "first_name last_name email profile_pic");

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: {
        id: newConversation._id,
        participants: newConversation.participants.map(p => p._id),
        createdAt: newConversation.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Error creating conversation",
      details: err.message
    });
  }
}

// GET /conversations/:id → getConversationById
async function getConversationById(req, res) {
  try {
    const conversationId = req.params.id;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format"
      });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "first_name last_name email profile_pic");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found"
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      participant => participant._id.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to view this conversation"
      });
    }

    // Fetch first 10 messages of the conversation
    const messages = await Message.find({ conversation_id: conversationId })
      .populate("sender_id", "first_name last_name email profile_pic")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        participants: conversation.participants.map(p => p._id),
        messages: messages.reverse() // Reverse to show oldest first
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Error fetching conversation",
      details: err.message
    });
  }
}

// DELETE /conversations/:id → deleteConversation
async function deleteConversation(req, res) {
  try {
    const conversationId = req.params.id;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format"
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found"
      });
    }

    // Check if user is authorized (must be a participant)
    const isParticipant = conversation.participants.some(
      participantId => participantId.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this conversation"
      });
    }

    // Delete all messages in the conversation first
    await Message.deleteMany({ conversation_id: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Error deleting conversation",
      details: err.message
    });
  }
}

module.exports = {
  getConversations,
  createConversation,
  getConversationById,
  deleteConversation
};
