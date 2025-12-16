const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Global socket.io instance
let io = null;

// Map to store userId -> [socketIds] mappings
// Multiple devices per user are supported
const userSocketMap = new Map();

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Authentication error: Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      return next(new Error('Authentication error: ' + error.message));
    }
  });

  // Connection event handler
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Add socket to user's socket list
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, []);
    }
    userSocketMap.get(userId).push(socket.id);

    // Update user online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }

    // TODO: Emit online status to user's contacts when Connection model is integrated
    // This requires user.connections field which will be added in Epic 2 integration
    /*
    try {
      const user = await User.findById(userId).populate('connections', '_id');
      if (user && user.connections) {
        const contactIds = user.connections.map(c => c._id.toString());
        
        // Emit to each contact who is online
        contactIds.forEach(contactId => {
          const contactSocketIds = getUserSocketId(contactId);
          contactSocketIds.forEach(socketId => {
            io.to(socketId).emit('user:online', {
              userId: userId,
              status: 'online'
            });
          });
        });
      }
    } catch (error) {
      console.error('Error emitting online status:', error);
    }
    */

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);

      // Remove socket from user's socket list
      if (userSocketMap.has(userId)) {
        const socketIds = userSocketMap.get(userId);
        const index = socketIds.indexOf(socket.id);
        if (index > -1) {
          socketIds.splice(index, 1);
        }

        // If no more sockets for this user, mark as offline
        if (socketIds.length === 0) {
          userSocketMap.delete(userId);

          try {
            // Update user offline status and lastSeen
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            });

            // TODO: Emit offline status to user's contacts when Connection model is integrated
            /*
            const user = await User.findById(userId).populate('connections', '_id');
            if (user && user.connections) {
              const contactIds = user.connections.map(c => c._id.toString());
              
              contactIds.forEach(contactId => {
                const contactSocketIds = getUserSocketId(contactId);
                contactSocketIds.forEach(socketId => {
                  io.to(socketId).emit('user:offline', {
                    userId: userId,
                    status: 'offline',
                    lastSeen: new Date()
                  });
                });
              });
            }
            */
          } catch (error) {
            console.error('Error updating offline status:', error);
          }
        }
      }
    });
  });

  return io;
};

/**
 * Get the Socket.io server instance
 * @returns {Server|null} Socket.io server instance
 */
const getSocketServer = () => {
  return io;
};

/**
 * Get socket IDs for a user
 * @param {string} userId - User ID
 * @returns {Array<string>} Array of socket IDs
 */
const getUserSocketId = (userId) => {
  return userSocketMap.get(userId.toString()) || [];
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
const emitToUser = (userId, event, data) => {
  const socketIds = getUserSocketId(userId);
  socketIds.forEach(socketId => {
    if (io) {
      io.to(socketId).emit(event, data);
    }
  });
};

/**
 * Emit event to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
const emitToUsers = (userIds, event, data) => {
  userIds.forEach(userId => {
    emitToUser(userId, event, data);
  });
};

/**
 * Clear user socket mappings (for testing)
 */
const clearUserSocketMap = () => {
  userSocketMap.clear();
};

/**
 * Get Socket.io instance
 * @returns {Server|null} Socket.io server instance
 */
const getIO = () => {
  return io;
};

module.exports = {
  initializeSocketServer,
  getSocketServer,
  getUserSocketId,
  emitToUser,
  emitToUsers,
  clearUserSocketMap,
  getIO
};
