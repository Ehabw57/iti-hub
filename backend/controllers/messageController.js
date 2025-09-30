const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

async function getMessagesByConversation(req, res) {
  try {
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID format" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation_id: conversationId })
      .populate("sender_id", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching messages",
      error: err.message 
    });
  }
}

async function sendMessage(req, res) {
  try {
    const conversationId = req.params.id;
    const { content, image_url } = req.body;
    const senderId = req.user?.id; // To be discussed: Assuming req.user is set by authentication middleware

    if (!senderId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!content && !image_url) {
      return res.status(400).json({ message: "Message must have content or image" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID format" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: "User is not a participant in this conversation" });
    }

    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || ""
    };

    
    if (image_url) {
      messageData.media = [{
        url: image_url,
        type: "image"
      }];
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      last_message: newMessage._id
    });

    await newMessage.populate("sender_id", "name");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error sending message",
      error: err.message 
    });
  }
}

async function updateMessage(req, res) {
  try {
    const messageId = req.params.id;
    const { content, image_url } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender_id.toString() !== userId) {
      return res.status(403).json({ message: "You can only update your own messages" });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    
    if (image_url !== undefined) {
      if (image_url) {
        updateData.media = [{
          url: image_url,
          type: "image"
        }];
      } else {
        updateData.media = [];
      }
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    ).populate("sender_id", "name");

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error updating message",
      error: err.message 
    });
  }
}

async function deleteMessage(req, res) {
  try {
    const messageId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender_id.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    const conversation = await Conversation.findById(message.conversation_id);
    if (conversation && conversation.last_message?.toString() === messageId) {
        
      const lastMessage = await Message.findOne({
        conversation_id: message.conversation_id
      }).sort({ createdAt: -1 });

      await Conversation.findByIdAndUpdate(message.conversation_id, {
        last_message: lastMessage?._id || null
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting message",
      error: err.message 
    });
  }
}

module.exports = {
  getMessagesByConversation,
  sendMessage,
  updateMessage,
  deleteMessage
};
