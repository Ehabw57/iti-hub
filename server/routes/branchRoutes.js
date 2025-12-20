const express = require("express");
const router = express.Router();

const { getBranches } = require("../controllers/branch/branchController");

// GET /branches - Public: returns enabled branches only
router.get("/", getBranches);

module.exports = router;
