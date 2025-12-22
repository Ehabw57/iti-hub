const mongoose = require("mongoose");
const Message = require("../models/Message");

async function seedMessages(users) {
  console.log("💬 Seeding messages...");

  await Message.deleteMany();

  const messages = [];

  const conversationsCount = Math.floor(users.length / 2);

  for (let i = 0; i < conversationsCount; i++) {
    const conversationId = new mongoose.Types.ObjectId();

    const user1 = users[Math.floor(Math.random() * users.length)];
    let user2 = users[Math.floor(Math.random() * users.length)];

    while (user1._id.equals(user2._id)) {
      user2 = users[Math.floor(Math.random() * users.length)];
    }

    const messagesCount = Math.floor(Math.random() * 10) + 3;

    for (let j = 0; j < messagesCount; j++) {
      const sender = Math.random() > 0.5 ? user1 : user2;

      messages.push({
        conversation_id: conversationId,
        sender_id: sender._id,
        content: "Hello 👋 this is a seeded message",
        media: [],
        seen_by: Math.random() > 0.5 ? [user1._id, user2._id] : [],
      });
    }
  }

  await Message.insertMany(messages);

  console.log(`✅ Messages seeded: ${messages.length}`);
}

module.exports = seedMessages;
