const Connection = require("../models/Connection");

exports.deleteConnection = async (req, res) => {
  try {
    const userId = req.body.userId; 
    const { id } = req.params;

    const connection = await Connection.findById(id);

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const isUserConnected =
      connection.requester_id.equals(userId) ||
      connection.recipient_id.equals(userId);

    if (!isUserConnected) {
      return res.status(403).json({ error: "Unauthorized to remove this connection" });
    }

    if (connection.status !== 'accepted') {
      return res
        .status(400)
        .json({ error: "Cannot delete non-accepted connection" });
    }

    await Connection.findByIdAndDelete(id);

    return res.status(200).json({ message: "Connection deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
