const express = require("express");
const connectionRoute = express.Router();
const {
  deleteConnection,
  getReceivedRequests,
  getSentRequests,
  sendConnectionRequest,
  getConnections,
  handleConnection
} = require("../controllers/connectionController");

connectionRoute.delete("/connections/:id", deleteConnection);
connectionRoute.post("/connections/request/:id", sendConnectionRequest);
connectionRoute.get("/connections/requests", getReceivedRequests);
connectionRoute.get("/connections/requests/sent", getSentRequests);
connectionRoute.get("/connections", getConnections);
connectionRoute.put("/connections/:id/accept", (req, res) => handleConnection(req, res, "accept"));
connectionRoute.put("/connections/:id/block", (req, res) => handleConnection(req, res, "block"));

module.exports = connectionRoute;
