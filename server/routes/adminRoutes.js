const express = require("express");
const router = express.Router();

const { checkAuth, authorize } = require("../middlewares/checkAuth");

// Admin controllers
const {
  createBranch,
  updateBranch,
  disableBranch,
  listBranches,
} = require("../controllers/admin/branches/branchController");

const {
  createRound,
  updateRound,
  startRound,
  endRound,
  disableRound,
  listBranchRounds,
} = require("../controllers/admin/rounds/roundController");

const {
  createTrack,
  updateTrack,
  disableTrack,
  listRoundTracksAdmin,
} = require("../controllers/admin/tracks/trackController");

const {
  createTag,
  updateTag,
  disableTag,
  listTags,
} = require("../controllers/admin/tags/tagController");

const {
  assignEditor,
  removeEditor,
} = require("../controllers/admin/editors/editorController");

const {
  verifyUser,
  rejectVerification,
  listUsers,
} = require("../controllers/admin/users/userVerificationController");

const {
  graduateEnrollment,
  listEnrollments,
} = require("../controllers/admin/enrollments/enrollmentController");

// All admin routes require authentication and admin role
router.use(checkAuth, authorize("admin"));

// ============== BRANCHES ==============
router.get("/branches", listBranches);
router.post("/branches", createBranch);
router.patch("/branches/:branchId", updateBranch);
router.post("/branches/:branchId/disable", disableBranch);

// ============== ROUNDS ==============
router.get("/branches/:branchId/rounds", listBranchRounds);
router.post("/branches/:branchId/rounds", createRound);
router.patch("/rounds/:roundId", updateRound);
router.post("/rounds/:roundId/start", startRound);
router.post("/rounds/:roundId/end", endRound);
router.post("/rounds/:roundId/disable", disableRound);

// ============== TRACKS (per-round) ==============
router.get("/tracks", listRoundTracksAdmin);
router.post("/rounds/:roundId/tracks", createTrack);
router.patch("/tracks/:trackId", updateTrack);
router.post("/tracks/:trackId/disable", disableTrack);

// ============== TAGS ==============
router.get("/tags", listTags);
router.post("/tags", createTag);
router.patch("/tags/:tagId", updateTag);
router.post("/tags/:tagId/disable", disableTag);

// ============== EDITORS ==============
router.post("/editors", assignEditor);
router.delete("/editors/:userId", removeEditor);

// ============== USERS & VERIFICATION ==============
router.get("/users", listUsers);
router.post("/users/:userId/verify", verifyUser);
router.delete("/users/:userId/verify", rejectVerification);

// ============== ENROLLMENTS ==============
router.get("/enrollments", listEnrollments);
router.post("/enrollments/:enrollmentId/graduate", graduateEnrollment);

module.exports = router;
