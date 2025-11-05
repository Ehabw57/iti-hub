const express = require("express");
const connectionRoute = express.Router();
const {
  deleteConnection,
  getReceivedRequests,
  getSentRequests,
  sendConnectionRequest,
  getConnections
} = require("../controllers/connectionController");

connectionRoute.delete("/connections/:id", deleteConnection);
connectionRoute.post("/connections/request/:id", sendConnectionRequest);
connectionRoute.get("/connections/requests", getReceivedRequests);
connectionRoute.get("/connections/requests/sent", getSentRequests);
connectionRoute.get("/connections", getConnections);

module.exports = connectionRoute;
