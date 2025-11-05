const Connection = require("../models/Connection");
const User = require("../models/User"); // you used this but didn't import it

const sendError = (res, status, message) =>
  res.status(status).json({ error: message });

const deleteConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await Connection.findById(id);
    if (!connection) return sendError(res, 404, "Connection not found");

    const isConnected =
      connection.requester_id.equals(userId) ||
      connection.recipient_id.equals(userId);

    if (!isConnected)
      return sendError(res, 403, "Unauthorized to remove this connection");
    if (connection.status !== "accepted")
      return sendError(res, 400, "Cannot delete non-accepted connection");

    await connection.deleteOne();
    res.status(200).json({ message: "Connection deleted successfully" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await Connection.find({
      recipient_id: userId,
      status: "pending",
    }).populate("requester_id", "name email profilePicture");

    res.status(200).json({ connections });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await Connection.find({
      requester_id: userId,
      status: "pending",
    }).populate("recipient_id", "name email profilePicture");

    res.status(200).json({ connections });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

const sendConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id:recipientId } = req.params;

    if (!recipientId) return sendError(res, 400, "Recipient ID is required");
    if (recipientId === userId)
      return sendError(res, 400, "Cannot send connection request to yourself");

    const [existingConnection, reversedConnection, recipient] =
      await Promise.all([
        Connection.findOne({ requester_id: userId, recipient_id: recipientId }),
        Connection.findOne({ requester_id: recipientId, recipient_id: userId }),
        User.findById(recipientId),
      ]);

    if (!recipient) return sendError(res, 404, "Recipient not found");

    if (existingConnection)
      return sendError(
        res,
        400,
        existingConnection.status === "accepted"
          ? "You are already connected with this user"
          : "Connection request already exists"
      );

    if (reversedConnection) {
      reversedConnection.status = "accepted";
      await reversedConnection.save();
      return res.status(200).json({
        message: "Connection request accepted automatically",
        connection: reversedConnection,
      });
    }

    const newConnection = await Connection.create({
      requester_id: userId,
      recipient_id: recipientId,
      status: "pending",
    });

    res.status(201).json({
      message: "Connection request sent successfully",
      connection: newConnection,
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

module.exports = {
  deleteConnection,
  getReceivedRequests,
  getSentRequests,
  sendConnectionRequest,
};
