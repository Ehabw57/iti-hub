const express = require('express');
const { checkAuth } = require('../middlewares/checkAuth');

const { updateRound, deleteRound } = require('../controllers/course/branchAdminController');
const { listRoundTracks, createTrack } = require('../controllers/course/trackAdminController');

/**
 * Round routes — second level of the hierarchy (Branches → Rounds → Tracks).
 * Mounted at `/rounds`.
 */
const roundRoutes = express.Router();

// ---- Round admin ----
roundRoutes.patch('/:id', checkAuth, updateRound);
roundRoutes.delete('/:id', checkAuth, deleteRound);

// ---- Tracks under a round ----
roundRoutes.get('/:roundId/tracks', listRoundTracks);
roundRoutes.post('/:roundId/tracks', checkAuth, createTrack);

module.exports = roundRoutes;
