const { Server } = require('socket.io');
const { createServer } = require('http');
const ioc = require('socket.io-client');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { initializeSocketServer, getSocketServer, getUserSocketId, clearUserSocketMap } = require('../../utils/socketServer');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-socket-tests';
}

describe('Socket.io Server', () => {
  let httpServer;
  let io;
  let clientSocket;
  let testUser;
  let testToken;

  // Increase timeout for socket operations
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeAll(async () => {
    try {
      // Connect to test database
      await connectToDB();

      // Clean up any existing test user
      await User.deleteMany({ email: 'socket@test.com' });

      // Create test user
      testUser = await User.create({
        username: 'socketuser',
        email: 'socket@test.com',
        password: 'Password123!',
        fullName: 'Socket User',
        firstName: 'Socket',
        lastName: 'User'
      });

      // Generate test JWT token
      testToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    } catch (error) {
      console.error('beforeAll error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up test user
    await User.deleteMany({ email: 'socket@test.com' });
  });

  beforeEach((done) => {
    // Create HTTP server for each test
    httpServer = createServer();
    io = initializeSocketServer(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      done();
    });
  });

  afterEach((done) => {
    // Clean up sockets and server
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (httpServer) {
      httpServer.close(() => {
        // Clear user socket map after each test
        clearUserSocketMap();
        done();
      });
    } else {
      clearUserSocketMap();
      done();
    }
  });

  describe('Server Setup', () => {
    it('should setup Socket.io server successfully', () => {
      expect(io).toBeDefined();
      expect(io instanceof Server).toBe(true);
    });

    it('should be retrievable via getSocketServer', () => {
      const retrievedIo = getSocketServer();
      expect(retrievedIo).toBe(io);
    });
  });

  describe('Authentication', () => {
    it('should authenticate socket connection with JWT', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        fail(`Connection should succeed with valid token: ${error.message}`);
      });
    });

    it('should reject connection without valid JWT', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      });

      clientSocket.on('connect', () => {
        fail('Connection should not succeed with invalid token');
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        done();
      });
    });

    it('should reject connection without token', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        fail('Connection should not succeed without token');
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        done();
      });
    });
  });

  describe('User Mappings', () => {
    it('should store userId → socketId mapping on connect', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', () => {
        const socketId = getUserSocketId(testUser._id.toString());
        expect(socketId).toBeDefined();
        expect(Array.isArray(socketId)).toBe(true);
        expect(socketId.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should remove mapping on disconnect', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', () => {
        const socketId = getUserSocketId(testUser._id.toString());
        expect(socketId).toBeDefined();

        clientSocket.disconnect();

        // Wait a bit for disconnect to process
        setTimeout(() => {
          const socketIdAfterDisconnect = getUserSocketId(testUser._id.toString());
          expect(socketIdAfterDisconnect).toEqual([]);
          done();
        }, 100);
      });
    });

    it('should handle multiple connections per user', (done) => {
      const port = httpServer.address().port;
      
      const client1 = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      client1.on('connect', () => {
        const client2 = ioc(`http://localhost:${port}`, {
          auth: { token: testToken }
        });

        client2.on('connect', () => {
          const socketIds = getUserSocketId(testUser._id.toString());
          expect(socketIds.length).toBe(2);
          
          client1.disconnect();
          client2.disconnect();
          done();
        });
      });
    });
  });

  describe('Online Status', () => {
    it('should update user online status on connect', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', async () => {
        // Wait a bit for status update
        setTimeout(async () => {
          const user = await User.findById(testUser._id);
          expect(user.isOnline).toBe(true);
          done();
        }, 100);
      });
    });

    it('should update user lastSeen on disconnect', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', async () => {
        const beforeDisconnect = new Date();
        clientSocket.disconnect();

        // Wait for disconnect to process
        setTimeout(async () => {
          const user = await User.findById(testUser._id);
          expect(user.isOnline).toBe(false);
          expect(user.lastSeen).toBeDefined();
          expect(user.lastSeen.getTime()).toBeGreaterThanOrEqual(beforeDisconnect.getTime());
          done();
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: 'malformed.token.here' }
      });

      clientSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();
        done();
      });
    });

    it('should handle reconnection scenarios', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      let connectCount = 0;

      clientSocket.on('connect', () => {
        connectCount++;
        
        if (connectCount === 1) {
          // First connection, disconnect
          clientSocket.disconnect();
          // Reconnect
          setTimeout(() => {
            clientSocket.connect();
          }, 100);
        } else if (connectCount === 2) {
          // Second connection successful
          expect(connectCount).toBe(2);
          done();
        }
      });
    });

    it('should clean up resources on disconnect', (done) => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', () => {
        const userId = testUser._id.toString();
        const socketIds = getUserSocketId(userId);
        expect(socketIds.length).toBeGreaterThan(0);

        clientSocket.disconnect();

        setTimeout(() => {
          const socketIdsAfter = getUserSocketId(userId);
          expect(socketIdsAfter.length).toBe(0);
          done();
        }, 100);
      });
    });
  });

  describe('Connection Events', () => {
    it('should log connection events', (done) => {
      const port = httpServer.address().port;
      const originalLog = console.log;
      let logCalled = false;

      console.log = (...args) => {
        if (args[0] && args[0].includes('connected')) {
          logCalled = true;
        }
        originalLog.apply(console, args);
      };

      clientSocket = ioc(`http://localhost:${port}`, {
        auth: { token: testToken }
      });

      clientSocket.on('connect', () => {
        setTimeout(() => {
          console.log = originalLog;
          expect(logCalled).toBe(true);
          done();
        }, 50);
      });
    });

    it('should handle concurrent connections', (done) => {
      const port = httpServer.address().port;
      const connections = [];
      let connectedCount = 0;

      for (let i = 0; i < 5; i++) {
        const client = ioc(`http://localhost:${port}`, {
          auth: { token: testToken }
        });

        client.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === 5) {
            // All connected
            const socketIds = getUserSocketId(testUser._id.toString());
            expect(socketIds.length).toBe(5);
            
            // Clean up
            connections.forEach(c => c.disconnect());
            done();
          }
        });

        connections.push(client);
      }
    });
  });
});
