const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");


router.get("/notifications", getNotifications);
router.put("/notifications/:id/read",  markNotificationRead);
router.put("/notifications/read-all",  markAllNotificationsRead);

module.exports = router;
