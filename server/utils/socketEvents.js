const Conversation = require('../models/Conversation');
const { getUserSocketId, emitToUser } = require('./socketServer');

// Throttle map for typing events: { userId-conversationId: timestamp }
const typingThrottleMap = new Map();
const TYPING_THROTTLE_INTERVAL = 1000; // 1 second

/**
 * Setup Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * message:send - Real-time message delivery
     * Emits to all conversation participants except sender
     */
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, senderId, senderName, image, messageId } = data;

        if (!conversationId || !senderId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== senderId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('message:new', {
                conversationId,
                content,
                senderId,
                senderName,
                image,
                messageId,
                timestamp: new Date()
              });
            });
          }
        });
      } catch (error) {
        console.error('Error in message:send event:', error);
      }
    });

    /**
     * message:seen - Seen status updates
     * Emits to all conversation participants
     */
    socket.on('message:seen', async (data) => {
      try {
        const { conversationId, userId: seenByUserId } = data;

        if (!conversationId || !seenByUserId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          const socketIds = getUserSocketId(participantId);
          socketIds.forEach(socketId => {
            io.to(socketId).emit('message:seen', {
              conversationId,
              userId: seenByUserId,
              timestamp: new Date()
            });
          });
        });
      } catch (error) {
        console.error('Error in message:seen event:', error);
      }
    });

    /**
     * typing:start - User starts typing
     * Emits to conversation participants except sender
     */
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId, userId: typingUserId } = data;

        if (!conversationId || !typingUserId) {
          return;
        }

        // Check throttle
        const throttleKey = `${typingUserId}-${conversationId}`;
        const lastEmit = typingThrottleMap.get(throttleKey);
        const now = Date.now();

        if (lastEmit && (now - lastEmit) < TYPING_THROTTLE_INTERVAL) {
          return; // Throttled
        }

        typingThrottleMap.set(throttleKey, now);

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== typingUserId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('typing:start', {
                conversationId,
                userId: typingUserId
              });
            });
          }
        });

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          participants.forEach(participantId => {
            if (participantId !== typingUserId) {
              const socketIds = getUserSocketId(participantId);
              socketIds.forEach(socketId => {
                io.to(socketId).emit('typing:stop', {
                  conversationId,
                  userId: typingUserId
                });
              });
            }
          });
        }, 3000);
      } catch (error) {
        console.error('Error in typing:start event:', error);
      }
    });

    /**
     * typing:stop - User stops typing
     * Emits to conversation participants except sender
     */
    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId, userId: typingUserId } = data;

        if (!conversationId || !typingUserId) {
          return;
        }

        // Get conversation to find participants
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return;
        }

        // Emit to all participants except sender
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== typingUserId) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('typing:stop', {
                conversationId,
                userId: typingUserId
              });
            });
          }
        });
      } catch (error) {
        console.error('Error in typing:stop event:', error);
      }
    });
  });
};

/**
 * Clear typing throttle map (for testing)
 */
const clearTypingThrottle = () => {
  typingThrottleMap.clear();
};

module.exports = {
  setupSocketEvents,
  clearTypingThrottle
};
