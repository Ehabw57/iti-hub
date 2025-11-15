const mongoose = require("mongoose");
const Notification = require("../models/Notification");

async function getNotifications(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "unauthorized" });

    const status = req.query.status;

    const pageNum = Number(req.query.page) || 1;
    const limitNum = Number(req.query.limit) || 10;

    const filter = { ...(status === "read"
        ? { isRead: true }
        : status === "unread"
        ? { isRead: false }
        : {}), user: userId };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("_id type message isRead createdAt")
    
    const data = notifications.map((n)=>({
        id: n._id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
    }));
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
        },
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ success: false, message: "internal server error" });
  }

}


async function markNotificationRead(req, res) {
    try {
        const userId = req.user && req.user.id;
        if (!userId)
          return res.status(401).json({ success: false, message: "unauthorized" });

        const { id } = req.params;
        if ( !mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ success: false, message: "invalid notification id" });
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { $set: { isRead: true } },
            { new: true }
        ).select("_id isRead");

        if (!notification) {
            return res.status(404).json({ success: false, message: "notification not found" });
        }

        return res.status(200).json({
            success: true,
            message: "notification marked as read",
            notification:{id: notification._id.toString(), isRead: notification.isRead},
        });
    } catch (error) {
        console.error("markNotificationRead error:", error);
        return res.status(500).json({ success: false, message: "internal server error" });
    }
    
  }

  async function markAllNotificationsRead(req,res) {
    try {
        const userId = req.user && req.user.id;
        if (!userId)
          return res.status(401).json({ success: false, message: "unauthorized" });

        await Notification.updateMany(
            {user: userId, isRead: false},
            { $set: { isRead: true } }
        );
        return res.status(200).json({
            success: true,
            message: "all notifications marked as read",
        });
    } catch (error) {
        console.error("markAllNotificationsRead error:", error);
        return res.status(500).json({ success: false, message: "internal server error" });
    }
    
  }

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
}
