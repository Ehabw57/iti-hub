const Notification = require("../models/Notification");

const NOTIFICATION_TYPES = ["like", "comment", "connect", "dm"];

async function seedNotifications(users, posts = [], comments = []) {
  console.log("🔔 Seeding notifications...");

  await Notification.deleteMany();

  const notifications = [];

  const notificationsCount = users.length * 5; // عدد معقول

  for (let i = 0; i < notificationsCount; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    let receiver = users[Math.floor(Math.random() * users.length)];

    // نتأكد إن المرسل غير المستقبل
    while (receiver._id.equals(sender._id)) {
      receiver = users[Math.floor(Math.random() * users.length)];
    }

    const type =
      NOTIFICATION_TYPES[
        Math.floor(Math.random() * NOTIFICATION_TYPES.length)
      ];

    // entity_id حسب النوع
    let entity_id = sender._id;

    if (type === "like" && posts.length) {
      entity_id = posts[Math.floor(Math.random() * posts.length)]._id;
    }

    if (type === "comment" && comments.length) {
      entity_id = comments[Math.floor(Math.random() * comments.length)]._id;
    }

    notifications.push({
      type,
      sender_id: sender._id,
      receiver_id: receiver._id,
      entity_id,
      is_read: Math.random() > 0.5,
    });
  }

  await Notification.insertMany(notifications);

  console.log(`✅ Notifications seeded: ${notifications.length}`);
}

module.exports = seedNotifications;
