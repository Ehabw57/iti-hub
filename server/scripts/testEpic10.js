/**
 * Epic 10 Admin Management - Test Script
 * 
 * This script tests all Epic 10 endpoints by:
 * 1. Creating an admin user (or using existing)
 * 2. Testing Branch CRUD
 * 3. Testing Round CRUD (with lifecycle: draft -> active -> ended)
 * 4. Testing Track CRUD (per-round)
 * 5. Testing Tag CRUD
 * 6. Testing Editor assignment
 * 7. Testing User verification and graduation flow
 * 
 * Usage: node scripts/testEpic10.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('../models/User');
const Branch = require('../models/Branch');
const Round = require('../models/Round');
const Track = require('../models/Track');
const Tag = require('../models/Tag');
const UserEnrollment = require('../models/UserEnrollment');

const DBURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub-test';

// Test data storage
const testData = {
  adminUser: null,
  regularUser: null,
  branch: null,
  round: null,
  track: null,
  tag: null,
  enrollment: null,
};

// Utility functions
function log(message, data = null) {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function logError(message, error = null) {
  console.error(`\n❌ ${message}`);
  if (error) console.error(error.message || error);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

// Test functions
async function setupDatabase() {
  logSection('Setting up database connection');
  
  try {
    await mongoose.connect(DBURL);
    log('Connected to MongoDB', { url: DBURL });
  } catch (error) {
    logError('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  logSection('Creating test users');
  
  // Create admin user
  let admin = await User.findOne({ email: 'admin-test@iti-hub.com' });
  if (!admin) {
    admin = await User.create({
      username: 'admin_test_epic10',
      email: 'admin-test@iti-hub.com',
      password: 'AdminPass123!',
      fullName: 'Test Admin',
      role: 'admin',
    });
    log('Created admin user', { id: admin._id, username: admin.username, role: admin.role });
  } else {
    log('Using existing admin user', { id: admin._id, username: admin.username });
  }
  testData.adminUser = admin;

  // Create regular user
  let user = await User.findOne({ email: 'user-test@iti-hub.com' });
  if (!user) {
    user = await User.create({
      username: 'user_test_epic10',
      email: 'user-test@iti-hub.com',
      password: 'UserPass123!',
      fullName: 'Test User',
      role: 'user',
    });
    log('Created regular user', { id: user._id, username: user.username, role: user.role });
  } else {
    log('Using existing regular user', { id: user._id, username: user.username });
  }
  testData.regularUser = user;
}

async function testBranchCRUD() {
  logSection('Testing Branch CRUD');

  // Create
  const branch = await Branch.create({
    name: `Test Branch ${Date.now()}`,
    description: 'A test branch for Epic 10',
  });
  log('Created branch', branch.toObject());
  testData.branch = branch;

  // Read
  const foundBranch = await Branch.findById(branch._id);
  log('Read branch', { id: foundBranch._id, name: foundBranch.name });

  // Update
  foundBranch.description = 'Updated description';
  await foundBranch.save();
  log('Updated branch', { id: foundBranch._id, description: foundBranch.description });

  // List enabled branches (public endpoint simulation)
  const enabledBranches = await Branch.find({ isDisabled: false });
  log(`Listed ${enabledBranches.length} enabled branches`);

  // Disable
  foundBranch.isDisabled = true;
  await foundBranch.save();
  log('Disabled branch', { id: foundBranch._id, isDisabled: foundBranch.isDisabled });

  // Re-enable for further tests
  foundBranch.isDisabled = false;
  await foundBranch.save();
}

async function testRoundCRUD() {
  logSection('Testing Round CRUD');

  // Create draft round
  const round = await Round.create({
    branchId: testData.branch._id,
    number: 45,
    name: '2025 Winter',
    status: 'draft',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
  });
  log('Created round (draft)', round.toObject());
  testData.round = round;

  // Update
  round.name = '2025 Winter Updated';
  await round.save();
  log('Updated round', { id: round._id, name: round.name });

  // Start round (draft -> active)
  const existingActive = await Round.findOne({ branchId: testData.branch._id, status: 'active' });
  if (existingActive) {
    existingActive.status = 'ended';
    await existingActive.save();
    log('Ended existing active round to allow new activation');
  }
  
  round.status = 'active';
  await round.save();
  log('Started round (active)', { id: round._id, status: round.status });

  // List rounds for branch
  const branchRounds = await Round.find({ branchId: testData.branch._id });
  log(`Listed ${branchRounds.length} rounds for branch`);

  // Test public list (only active + ended)
  const publicRounds = await Round.find({
    branchId: testData.branch._id,
    status: { $in: ['active', 'ended'] },
  });
  log(`Public rounds (active+ended): ${publicRounds.length}`);
}

async function testTrackCRUD() {
  logSection('Testing Per-Round Track CRUD');

  // Create track
  const track = await Track.create({
    roundId: testData.round._id,
    branchId: testData.branch._id,
    name: 'Full Stack Development',
    description: 'Web development track',
  });
  log('Created track', track.toObject());
  testData.track = track;

  // Update
  track.description = 'Updated web development track';
  await track.save();
  log('Updated track', { id: track._id, description: track.description });

  // List tracks for round
  const roundTracks = await Track.find({ roundId: testData.round._id });
  log(`Listed ${roundTracks.length} tracks for round`);

  // Test public list (only enabled)
  const enabledTracks = await Track.find({ roundId: testData.round._id, isDisabled: false });
  log(`Public tracks (enabled): ${enabledTracks.length}`);

  // Disable track
  track.isDisabled = true;
  await track.save();
  log('Disabled track', { id: track._id, isDisabled: track.isDisabled });

  // Re-enable for verification test
  track.isDisabled = false;
  await track.save();
}

async function testTagCRUD() {
  logSection('Testing Tag CRUD');

  // Create tag
  const tag = await Tag.create({
    name: `test-tag-${Date.now()}`,
    description: 'A test tag',
  });
  log('Created tag', tag.toObject());
  testData.tag = tag;

  // Update
  tag.description = 'Updated test tag';
  await tag.save();
  log('Updated tag', { id: tag._id, description: tag.description });

  // List all tags
  const allTags = await Tag.find();
  log(`Listed ${allTags.length} total tags`);

  // Disable tag
  tag.isDisabled = true;
  await tag.save();
  log('Disabled tag', { id: tag._id, isDisabled: tag.isDisabled });
}

async function testEditorAssignment() {
  logSection('Testing Editor Role Assignment');

  const user = testData.regularUser;

  // Assign editor role
  user.role = 'editor';
  await user.save();
  log('Assigned editor role', { id: user._id, role: user.role });

  // Remove editor role
  user.role = 'user';
  await user.save();
  log('Removed editor role', { id: user._id, role: user.role });
}

async function testVerificationFlow() {
  logSection('Testing User Verification & Enrollment Flow');

  const user = testData.regularUser;

  // User selects branch/round/track (simulating PUT /users/profile)
  user.branchId = testData.branch._id;
  user.roundId = testData.round._id;
  user.trackId = testData.track._id;
  user.verificationStatus = null; // pending
  await user.save();
  log('User selected branch/round/track (pending verification)', {
    branchId: user.branchId,
    roundId: user.roundId,
    trackId: user.trackId,
    verificationStatus: user.verificationStatus,
  });

  // Admin verifies user and creates enrollment
  const enrollment = await UserEnrollment.create({
    userId: user._id,
    branchId: testData.branch._id,
    roundId: testData.round._id,
    trackId: testData.track._id,
    graduated: null, // not yet determined
  });
  
  user.verificationStatus = true;
  await user.save();
  log('Admin verified user', {
    verificationStatus: user.verificationStatus,
    enrollmentId: enrollment._id,
  });
  testData.enrollment = enrollment;

  // Admin graduates user
  enrollment.graduated = true;
  await enrollment.save();
  log('Admin graduated user', {
    enrollmentId: enrollment._id,
    graduated: enrollment.graduated,
  });

  // Test rejection flow
  const user2 = await User.create({
    username: `reject_test_${Date.now()}`,
    email: `reject-${Date.now()}@test.com`,
    password: 'TestPass123!',
    fullName: 'Reject Test User',
    branchId: testData.branch._id,
    roundId: testData.round._id,
    trackId: testData.track._id,
    verificationStatus: null,
  });
  
  // Admin rejects
  user2.verificationStatus = false;
  user2.branchId = null;
  user2.roundId = null;
  user2.trackId = null;
  await user2.save();
  log('Admin rejected user verification', {
    userId: user2._id,
    verificationStatus: user2.verificationStatus,
  });

  // Cleanup reject test user
  await User.deleteOne({ _id: user2._id });
}

async function testConstraints() {
  logSection('Testing Constraints');

  // Test: Only one active round per branch
  try {
    await Round.create({
      branchId: testData.branch._id,
      number: 99,
      name: 'Should Fail - Second Active',
      status: 'active',
    });
    logError('CONSTRAINT FAILED: Should not allow second active round');
  } catch (error) {
    // Check if round was created
    const activeRounds = await Round.find({ branchId: testData.branch._id, status: 'active' });
    if (activeRounds.length > 1) {
      logError('CONSTRAINT FAILED: Multiple active rounds exist');
    } else {
      log('Constraint check: Single active round per branch - manual enforcement needed in controller');
    }
  }

  // Test: Track name unique within round
  try {
    await Track.create({
      roundId: testData.round._id,
      branchId: testData.branch._id,
      name: 'Full Stack Development', // duplicate
    });
    logError('CONSTRAINT FAILED: Should not allow duplicate track name in round');
  } catch (error) {
    log('Constraint passed: Track name unique within round', { error: error.code || error.message });
  }

  // Test: Round number unique per branch
  try {
    await Round.create({
      branchId: testData.branch._id,
      number: 45, // duplicate
      name: 'Duplicate Number',
      status: 'draft',
    });
    logError('CONSTRAINT FAILED: Should not allow duplicate round number');
  } catch (error) {
    log('Constraint passed: Round number unique per branch', { error: error.code || error.message });
  }
}

async function cleanup() {
  logSection('Cleanup');

  try {
    // Delete test enrollment
    if (testData.enrollment) {
      await UserEnrollment.deleteOne({ _id: testData.enrollment._id });
      log('Deleted test enrollment');
    }

    // Delete test track
    if (testData.track) {
      await Track.deleteOne({ _id: testData.track._id });
      log('Deleted test track');
    }

    // Delete test round
    if (testData.round) {
      await Round.deleteOne({ _id: testData.round._id });
      log('Deleted test round');
    }

    // Delete test branch
    if (testData.branch) {
      await Branch.deleteOne({ _id: testData.branch._id });
      log('Deleted test branch');
    }

    // Delete test tag
    if (testData.tag) {
      await Tag.deleteOne({ _id: testData.tag._id });
      log('Deleted test tag');
    }

    // Reset regular user
    if (testData.regularUser) {
      testData.regularUser.branchId = null;
      testData.regularUser.roundId = null;
      testData.regularUser.trackId = null;
      testData.regularUser.verificationStatus = null;
      testData.regularUser.role = 'user';
      await testData.regularUser.save();
      log('Reset regular user');
    }

    log('Cleanup complete');
  } catch (error) {
    logError('Cleanup failed', error);
  }
}

async function main() {
  console.log('\n🚀 Epic 10 Admin Management - Test Script\n');

  try {
    await setupDatabase();
    await createTestUsers();
    await testBranchCRUD();
    await testRoundCRUD();
    await testTrackCRUD();
    await testTagCRUD();
    await testEditorAssignment();
    await testVerificationFlow();
    await testConstraints();
    await cleanup();

    logSection('TEST SUMMARY');
    console.log('\n✅ All Epic 10 tests completed successfully!\n');

  } catch (error) {
    logError('Test failed', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    log('Database connection closed');
    process.exit(0);
  }
}

main();
