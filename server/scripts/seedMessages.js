const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Connection = require("../models/Connection");
const { SEED_MESSAGE_THREADS } = require("./data/seedData");
const { getRandomDateBetween, weightedRandom } = require("./utils/seedHelpers");

/**
 * Seed realistic conversations and messages between connected users
 * @param {Array} users - Array of user documents
 * @param {Array} connections - Array of connection documents (follows)
 * @returns {Promise<Object>} - Created conversations and messages
 */
async function seedMessages(users, connections = []) {
  console.log("💬 Seeding messages...");

  await Message.deleteMany();
  await Conversation.deleteMany();

  if (!users || users.length < 2) {
    console.log("⚠️  Not enough users to create messages");
    return { conversations: [], messages: [] };
  }

  const conversations = [];
  const messages = [];
  const now = new Date();

  // Find mutual follows (users who follow each other) for more natural conversations
  const mutualFollows = [];
  const followMap = new Map();

  if (connections.length > 0) {
    connections.forEach(conn => {
      if (conn.status === 'following') {
        const key = conn.follower.toString();
        if (!followMap.has(key)) followMap.set(key, []);
        followMap.get(key).push(conn.following.toString());
      }
    });

    // Find mutual follows
    for (const [followerId, followingList] of followMap) {
      for (const followingId of followingList) {
        const reverseFollows = followMap.get(followingId) || [];
        if (reverseFollows.includes(followerId)) {
          // Avoid duplicates (A-B and B-A)
          const pairKey = [followerId, followingId].sort().join('-');
          if (!mutualFollows.some(m => m.key === pairKey)) {
            mutualFollows.push({
              key: pairKey,
              user1: users.find(u => u._id.toString() === followerId),
              user2: users.find(u => u._id.toString() === followingId),
            });
          }
        }
      }
    }
  }

  console.log(`   📊 Found ${mutualFollows.length} mutual follows`);

  // Create conversations from mutual follows (or random pairs if not enough)
  let conversationPairs = mutualFollows.slice(0, 15).map(m => [m.user1, m.user2]);
  
  // If not enough mutual follows, add random pairs
  if (conversationPairs.length < 10) {
    const needed = 10 - conversationPairs.length;
    const usedPairs = new Set(conversationPairs.map(p => 
      [p[0]._id.toString(), p[1]._id.toString()].sort().join('-')
    ));

    for (let i = 0; i < needed && i < 50; i++) {
      const user1 = users[Math.floor(Math.random() * users.length)];
      let user2 = users[Math.floor(Math.random() * users.length)];
      
      let attempts = 0;
      while (user1._id.equals(user2._id) && attempts < 10) {
        user2 = users[Math.floor(Math.random() * users.length)];
        attempts++;
      }

      if (user1._id.equals(user2._id)) continue;

      const pairKey = [user1._id.toString(), user2._id.toString()].sort().join('-');
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        conversationPairs.push([user1, user2]);
      }
    }
  }

  console.log(`   💭 Creating ${conversationPairs.length} conversations...`);

  // Create conversations and messages
  for (let i = 0; i < conversationPairs.length; i++) {
    const [user1, user2] = conversationPairs[i];
    if (!user1 || !user2) continue;

    // Pick a random thread template
    const threadTemplate = SEED_MESSAGE_THREADS[i % SEED_MESSAGE_THREADS.length];
    
    // Create conversation
    const conversationStart = getRandomDateBetween(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)   // 1 day ago
    );

    const conversation = await Conversation.create({
      participants: [user1._id, user2._id],
      isGroup: false,
      createdAt: conversationStart,
      updatedAt: conversationStart,
    });

    conversations.push(conversation);

    // Create messages for this conversation
    let lastMessageTime = conversationStart;
    const threadMessages = threadTemplate.messages;

    for (let j = 0; j < threadMessages.length; j++) {
      // Alternate between users (user1 starts odd threads, user2 starts even)
      const sender = (j % 2 === (i % 2)) ? user1 : user2;
      
      // Messages spaced out (10 minutes to 4 hours apart)
      const minMinutes = 10;
      const maxMinutes = 240;
      const messageTime = new Date(
        lastMessageTime.getTime() + 
        (Math.random() * (maxMinutes - minMinutes) + minMinutes) * 60 * 1000
      );
      
      // Don't create messages in the future
      if (messageTime > now) break;

      const message = {
        conversation: conversation._id,
        sender: sender._id,
        content: threadMessages[j],
        status: 'delivered',
        seenBy: Math.random() > 0.3 ? [
          { userId: user1._id, seenAt: messageTime },
          { userId: user2._id, seenAt: messageTime },
        ] : [],
        createdAt: messageTime,
        updatedAt: messageTime,
      };

      messages.push(message);
      lastMessageTime = messageTime;
    }

    // Update conversation's last message
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: {
          content: lastMsg.content,
          senderId: lastMsg.sender,
          timestamp: lastMsg.createdAt,
        },
        updatedAt: lastMsg.createdAt,
      });
    }
  }

  // Bulk insert messages
  if (messages.length > 0) {
    await Message.insertMany(messages);
  }

  console.log(`✅ Conversations seeded: ${conversations.length}`);
  console.log(`✅ Messages seeded: ${messages.length}`);

  return { conversations, messages };
}

module.exports = seedMessages;
