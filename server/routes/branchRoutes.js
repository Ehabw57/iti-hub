const express = require('express');
const { checkAuth } = require('../middlewares/checkAuth');
const { requireRoles } = require('../middlewares/checkRoles');

// Branch controllers
const listBranches = require('../controllers/course/listBranchesController');
const getBranch = require('../controllers/course/getBranchController');
const {
  createBranch,
  updateBranch,
  deleteBranch,
  listRounds,
  createRound,
} = require('../controllers/course/branchAdminController');

/**
 * Branch routes — top-level entry point of the hierarchy
 * (Branches → Rounds → Tracks). Mounted at `/branches`.
 */
const branchRoutes = express.Router();

// ---- Branch catalog ----
branchRoutes.get('/', listBranches);
branchRoutes.get('/:id', getBranch);

// ---- Branch admin (Super Admin) ----
branchRoutes.post('/', checkAuth, requireRoles('super_admin'), createBranch);
branchRoutes.patch('/:id', checkAuth, requireRoles('super_admin'), updateBranch);
branchRoutes.delete('/:id', checkAuth, requireRoles('super_admin'), deleteBranch);

// ---- Rounds under a branch ----
branchRoutes.get('/:branchId/rounds', listRounds);
branchRoutes.post('/:branchId/rounds', checkAuth, createRound);

module.exports = branchRoutes;
