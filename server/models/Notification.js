const mongoose = require("mongoose");
const { NOTIFICATION_TYPES, GROUPABLE_NOTIFICATION_TYPES } = require('../utils/constants');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Recipient is required'],
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Actor is required'],
      index: true
    },
    actorCount: {
      type: Number,
      default: 1,
      min: 1
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Type is required'],
      index: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: function() {
        // Target is required for all types except 'follow'
        return this.type !== NOTIFICATION_TYPES.FOLLOW;
      }
    },
    targetModel: {
      type: String,
      enum: ['Post', 'Comment'],
      default: function() {
        // Determine the model based on notification type
        if (this.type === NOTIFICATION_TYPES.REPLY || this.type === NOTIFICATION_TYPES.COMMENT_LIKE) {
          return 'Comment';
        }
        if (this.type === NOTIFICATION_TYPES.LIKE || this.type === NOTIFICATION_TYPES.COMMENT || this.type === NOTIFICATION_TYPES.REPOST) {
          return 'Post';
        }
        return undefined;
      }
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, type: 1, target: 1 }); // For finding existing notification to group with

/**
 * Check if a notification type is groupable
 * @param {string} type - Notification type
 * @returns {boolean}
 */
NotificationSchema.statics.isGroupableType = function(type) {
  return GROUPABLE_NOTIFICATION_TYPES.includes(type);
};

/**
 * Create a new notification or update existing one (for groupable types)
 * @param {ObjectId} recipientId - User receiving the notification
 * @param {ObjectId} actorId - User performing the action
 * @param {string} type - Notification type
 * @param {ObjectId} targetId - Target post/comment (null for follow)
 * @returns {Promise<Notification|null>}
 */
NotificationSchema.statics.createOrUpdateNotification = async function(recipientId, actorId, type, targetId) {
  // Don't notify user of their own actions
  if (recipientId.toString() === actorId.toString()) {
    return null;
  }

  const isGroupable = this.isGroupableType(type);
  let isUpdate = false;

  if (isGroupable && targetId) {
    // Check if notification already exists for grouping
    const existingNotification = await this.findOne({
      recipient: recipientId,
      type: type,
      target: targetId
    });

    if (existingNotification) {
      // Check if the same actor is trying to create duplicate
      if (existingNotification.actor.toString() === actorId.toString()) {
        // Return existing notification without changes
        return existingNotification;
      }

      // Update existing notification (group)
      existingNotification.actor = actorId; // Most recent actor
      existingNotification.actorCount += 1;
      existingNotification.isRead = false; // Mark as unread again
      existingNotification.updatedAt = new Date();
      
      await existingNotification.save();
      
      // Populate for socket emission
      await existingNotification.populate('actor', 'username fullName profilePicture bio');
      await existingNotification.populate('target');
      
      // Emit socket event for update
      isUpdate = true;
      try {
        const { emitNotificationUpdate, emitNotificationCount } = require('../utils/socketEvents');
        const unreadCount = await this.getUnreadCount(recipientId);
        emitNotificationUpdate(recipientId.toString(), existingNotification);
        emitNotificationCount(recipientId.toString(), unreadCount);
      } catch (socketError) {
        console.error('Failed to emit notification update via socket:', socketError);
      }
      
      return existingNotification;
    }
  }

  // Create new notification
  const notificationData = {
    recipient: recipientId,
    actor: actorId,
    type: type,
    actorCount: 1
  };

  if (targetId) {
    notificationData.target = targetId;
  }

  const notification = await this.create(notificationData);
  
  // Populate for socket emission
  await notification.populate('actor', 'username fullName profilePicture bio');
  await notification.populate('target');
  
  // Emit socket event for new notification
  try {
    const { emitNotification, emitNotificationCount } = require('../utils/socketEvents');
    const unreadCount = await this.getUnreadCount(recipientId);
    emitNotification(recipientId.toString(), notification);
    emitNotificationCount(recipientId.toString(), unreadCount);
  } catch (socketError) {
    console.error('Failed to emit notification via socket:', socketError);
  }
  
  return notification;
};

/**
 * Get count of unread notifications for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>}
 */
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

/**
 * Mark a notification as read
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID (for verification)
 * @returns {Promise<Notification|null>}
 */
NotificationSchema.statics.markAsRead = async function(notificationId, userId) {
  const notification = await this.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId
    },
    {
      isRead: true
    },
    {
      new: true
    }
  );

  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>}
 */
NotificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      isRead: true
    }
  );

  return result;
};

module.exports = mongoose.model("Notification", NotificationSchema);

