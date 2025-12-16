const { createServer } = require('http');
const ioc = require('socket.io-client');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { initializeSocketServer, clearUserSocketMap } = require('../../utils/socketServer');
const { setupSocketEvents } = require('../../utils/socketEvents');
const { connectToDB } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-socket-events';
}

describe('Socket.io Real-time Events', () => {
  let httpServer;
  let io;
  let user1, user2, user3;
  let token1, token2, token3;
  let client1, client2, client3;
  let conversation;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeAll(async () => {
    await connectToDB();

    // Clean up existing test data
    await User.deleteMany({ email: { $in: ['socketevt1@test.com', 'socketevt2@test.com', 'socketevt3@test.com'] } });

    // Create test users
    user1 = await User.create({
      username: 'socketevt1',
      email: 'socketevt1@test.com',
      password: 'Password123!',
      fullName: 'User One'
    });

    user2 = await User.create({
      username: 'socketevt2',
      email: 'socketevt2@test.com',
      password: 'Password123!',
      fullName: 'User Two'
    });

    user3 = await User.create({
      username: 'socketevt3',
      email: 'socketevt3@test.com',
      password: 'Password123!',
      fullName: 'User Three'
    });

    // Generate tokens
    token1 = jwt.sign({ userId: user1._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    token2 = jwt.sign({ userId: user2._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    token3 = jwt.sign({ userId: user3._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a conversation between users
    conversation = await Conversation.createIndividual(user1._id, user2._id);
  });

  afterAll(async () => {
    await Conversation.deleteMany({ participants: { $in: [user1._id, user2._id, user3._id] } });
    await Message.deleteMany({ conversation: conversation?._id });
    await User.deleteMany({ email: { $in: ['socketevt1@test.com', 'socketevt2@test.com', 'socketevt3@test.com'] } });
  });

  beforeEach((done) => {
    httpServer = createServer();
    io = initializeSocketServer(httpServer);
    setupSocketEvents(io);
    
    httpServer.listen(() => {
      done();
    });
  });

  afterEach((done) => {
    if (client1 && client1.connected) client1.disconnect();
    if (client2 && client2.connected) client2.disconnect();
    if (client3 && client3.connected) client3.disconnect();
    
    if (io) io.close();
    if (httpServer) {
      httpServer.close(() => {
        clearUserSocketMap();
        done();
      });
    } else {
      clearUserSocketMap();
      done();
    }
  });

  describe('message:send event', () => {
    it('should emit to all conversation participants except sender', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          // Both connected, now send message
          const messageData = {
            conversationId: conversation._id.toString(),
            content: 'Test message',
            senderId: user1._id.toString(),
            senderName: 'User One'
          };

          client2.once('message:new', (data) => {
            expect(data.conversationId).toBe(messageData.conversationId);
            expect(data.content).toBe(messageData.content);
            expect(data.senderId).toBe(messageData.senderId);
            done();
          });

          client1.emit('message:send', messageData);
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should work for individual conversations', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          const messageData = {
            conversationId: conversation._id.toString(),
            content: 'Individual chat message',
            senderId: user1._id.toString()
          };

          client2.once('message:new', (data) => {
            expect(data.content).toBe('Individual chat message');
            done();
          });

          client1.emit('message:send', messageData);
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should work for group conversations', (done) => {
      const port = httpServer.address().port;
      
      // Create group conversation
      Conversation.createGroup(user1._id, 'Test Group', [user2._id, user3._id])
        .then(groupConversation => {
          client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
          client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });
          client3 = ioc(`http://localhost:${port}`, { auth: { token: token3 } });

          let connectedCount = 0;
          let receivedCount = 0;

          const checkConnected = () => {
            connectedCount++;
            if (connectedCount === 3) {
              const messageData = {
                conversationId: groupConversation._id.toString(),
                content: 'Group message',
                senderId: user1._id.toString()
              };

              const checkReceived = () => {
                receivedCount++;
                if (receivedCount === 2) {
                  // Both user2 and user3 received the message
                  done();
                }
              };

              client2.once('message:new', checkReceived);
              client3.once('message:new', checkReceived);

              client1.emit('message:send', messageData);
            }
          };

          client1.on('connect', checkConnected);
          client2.on('connect', checkConnected);
          client3.on('connect', checkConnected);
        });
    });

    it('should handle offline participants gracefully', (done) => {
      const port = httpServer.address().port;
      
      // Only user1 connects, user2 is offline
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.on('connect', () => {
        const messageData = {
          conversationId: conversation._id.toString(),
          content: 'Message to offline user',
          senderId: user1._id.toString()
        };

        // Should not throw error
        client1.emit('message:send', messageData);
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should not emit to sender', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.on('connect', () => {
        let messageReceived = false;

        client1.once('message:new', () => {
          messageReceived = true;
        });

        const messageData = {
          conversationId: conversation._id.toString(),
          content: 'Self message',
          senderId: user1._id.toString()
        };

        client1.emit('message:send', messageData);

        setTimeout(() => {
          expect(messageReceived).toBe(false);
          done();
        }, 200);
      });
    });
  });

  describe('message:seen event', () => {
    it('should emit to message sender when seen', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          const seenData = {
            conversationId: conversation._id.toString(),
            userId: user2._id.toString()
          };

          client1.once('message:seen', (data) => {
            expect(data.conversationId).toBe(seenData.conversationId);
            expect(data.userId).toBe(seenData.userId);
            done();
          });

          client2.emit('message:seen', seenData);
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should work for individual conversations', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          client1.once('message:seen', (data) => {
            expect(data.conversationId).toBe(conversation._id.toString());
            done();
          });

          client2.emit('message:seen', {
            conversationId: conversation._id.toString(),
            userId: user2._id.toString()
          });
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should work for group conversations', (done) => {
      const port = httpServer.address().port;
      
      Conversation.createGroup(user1._id, 'Seen Test Group', [user2._id, user3._id])
        .then(groupConversation => {
          client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
          client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

          let connectedCount = 0;
          const checkConnected = () => {
            connectedCount++;
            if (connectedCount === 2) {
              client1.once('message:seen', (data) => {
                expect(data.conversationId).toBe(groupConversation._id.toString());
                expect(data.userId).toBe(user2._id.toString());
                done();
              });

              client2.emit('message:seen', {
                conversationId: groupConversation._id.toString(),
                userId: user2._id.toString()
              });
            }
          };

          client1.on('connect', checkConnected);
          client2.on('connect', checkConnected);
        });
    });

    it('should handle multiple users seeing message', (done) => {
      const port = httpServer.address().port;
      
      Conversation.createGroup(user1._id, 'Multiple Seen Group', [user2._id, user3._id])
        .then(groupConversation => {
          client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
          client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });
          client3 = ioc(`http://localhost:${port}`, { auth: { token: token3 } });

          let connectedCount = 0;
          let seenCount = 0;

          const checkConnected = () => {
            connectedCount++;
            if (connectedCount === 3) {
              client1.on('message:seen', () => {
                seenCount++;
                if (seenCount === 2) {
                  done();
                }
              });

              client2.emit('message:seen', {
                conversationId: groupConversation._id.toString(),
                userId: user2._id.toString()
              });

              setTimeout(() => {
                client3.emit('message:seen', {
                  conversationId: groupConversation._id.toString(),
                  userId: user3._id.toString()
                });
              }, 50);
            }
          };

          client1.on('connect', checkConnected);
          client2.on('connect', checkConnected);
          client3.on('connect', checkConnected);
        });
    });
  });

  describe('typing events', () => {
    it('should emit typing:start to conversation participants', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          client2.once('typing:start', (data) => {
            expect(data.conversationId).toBe(conversation._id.toString());
            expect(data.userId).toBe(user1._id.toString());
            done();
          });

          client1.emit('typing:start', {
            conversationId: conversation._id.toString(),
            userId: user1._id.toString()
          });
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should emit typing:stop to conversation participants', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          client2.once('typing:stop', (data) => {
            expect(data.conversationId).toBe(conversation._id.toString());
            expect(data.userId).toBe(user1._id.toString());
            done();
          });

          client1.emit('typing:stop', {
            conversationId: conversation._id.toString(),
            userId: user1._id.toString()
          });
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });

    it('should not emit to self', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.on('connect', () => {
        let typingReceived = false;

        client1.once('typing:start', () => {
          typingReceived = true;
        });

        client1.emit('typing:start', {
          conversationId: conversation._id.toString(),
          userId: user1._id.toString()
        });

        setTimeout(() => {
          expect(typingReceived).toBe(false);
          done();
        }, 200);
      });
    });

    it('should throttle typing events (max 1 per second)', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          let receivedCount = 0;

          client2.on('typing:start', () => {
            receivedCount++;
          });

          // Emit 5 typing events rapidly
          for (let i = 0; i < 5; i++) {
            client1.emit('typing:start', {
              conversationId: conversation._id.toString(),
              userId: user1._id.toString()
            });
          }

          setTimeout(() => {
            // Should receive less than 5 due to throttling
            expect(receivedCount).toBeLessThan(5);
            done();
          }, 500);
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });
  });

  describe('online status events', () => {
    // NOTE: Online/offline status events require Connection model integration
    // These will be implemented when Epic 2 (Connections) is integrated with messaging
    
    xit('should emit when user connects', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.once('user:online', (data) => {
        expect(data.userId).toBe(user1._id.toString());
        expect(data.status).toBe('online');
        done();
      });

      client1.on('connect', () => {
        // Connection triggers online event
      });
    });

    xit('should emit when user disconnects', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });
      client2 = ioc(`http://localhost:${port}`, { auth: { token: token2 } });

      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          client2.once('user:offline', (data) => {
            expect(data.userId).toBe(user1._id.toString());
            expect(data.status).toBe('offline');
            expect(data.lastSeen).toBeDefined();
            done();
          });

          client1.disconnect();
        }
      };

      client1.on('connect', checkConnected);
      client2.on('connect', checkConnected);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid conversation ID gracefully', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.on('connect', () => {
        client1.emit('message:send', {
          conversationId: 'invalid-id',
          content: 'Test',
          senderId: user1._id.toString()
        });

        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle missing data fields gracefully', (done) => {
      const port = httpServer.address().port;
      
      client1 = ioc(`http://localhost:${port}`, { auth: { token: token1 } });

      client1.on('connect', () => {
        client1.emit('message:send', {});
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });
});
