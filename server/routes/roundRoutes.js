const express = require("express");
const router = express.Router();

const { getRoundsByBranch } = require("../controllers/round/roundController");

// GET /rounds?branchId=<id> - Public: returns active and ended rounds
router.get("/", getRoundsByBranch);

module.exports = router;
