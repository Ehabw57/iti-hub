/**
 * Admin Controllers Index
 * Exports all admin controller functions
 */
const statisticsController = require('./statisticsController');
const userManagementController = require('./userManagementController');
const postManagementController = require('./postManagementController');
const commentManagementController = require('./commentManagementController');
const communityManagementController = require('./communityManagementController');

module.exports = {
  ...statisticsController,
  ...userManagementController,
  ...postManagementController,
  ...commentManagementController,
  ...communityManagementController
};
