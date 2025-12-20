const express = require("express");
const router = express.Router();

const { getTracksByRound } = require("../controllers/track/trackController");

// GET /tracks?roundId=<id> - Public: returns enabled tracks for a round
router.get("/", getTracksByRound);

module.exports = router;
