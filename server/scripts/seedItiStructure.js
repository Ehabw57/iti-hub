/**
 * Seed the ITI Branch → Round → Track hierarchy plus community groups,
 * jobs, events, and role-based users.
 *
 * IDEMPOTENT: safe to run multiple times. Existing documents are matched
 * by their natural key and skipped; nothing is deleted.
 *
 * Usage:
 *   node scripts/seedItiStructure.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Branch = require('../models/Branch');
const Round = require('../models/Round');
const Track = require('../models/Track');
const User = require('../models/User');
const CommunityGroup = require('../models/CommunityGroup');
const Job = require('../models/Job');
const Event = require('../models/Event');

const {
  ITI_BRANCHES,
  ITI_TRACK_CATALOG,
  ITI_GROUPS,
  ITI_JOBS,
  ITI_EVENTS,
} = require('./data/itiData');

const DEFAULT_PASSWORD = 'User123!';
const TRACK_NAMES = Object.keys(ITI_TRACK_CATALOG);

/**
 * filename → Cloudinary URL for the branch cover images, produced by
 * scripts/uploadBranchImages.js (which uploads client/public/branches to the
 * `branch-images` Cloudinary folder). Lets fresh DBs get the same covers the
 * production branch documents carry.
 */
const BRANCH_IMAGE_MAP_PATH = path.resolve(__dirname, 'data/branchImageMap.json');
const loadBranchImageMap = () => {
  try {
    return JSON.parse(fs.readFileSync(BRANCH_IMAGE_MAP_PATH, 'utf8'));
  } catch {
    return [];
  }
};

/** Catalog entry (description + category) for a track name. */
const trackCatalogEntry = (name) =>
  ITI_TRACK_CATALOG[name] || { description: '', category: 'Others' };

/** Find a user by email or create one if missing. Returns the user doc. */
async function findOrCreateUser({ email, username, fullName, role, specialization, location }) {
  let user = await User.findOne({ email });
  if (user) return user;

  user = await User.create({
    email,
    username,
    password: DEFAULT_PASSWORD,
    fullName,
    role,
    specialization: specialization || null,
    location: location || null,
    isEmailVerified: true,
    isOnline: false,
    lastSeen: new Date(),
  });
  return user;
}

/** Slugify a name for stable natural keys. */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function seedBranches() {
  console.log('🏢 Seeding branches...');
  const imageMap = loadBranchImageMap();
  const entries = [];
  for (const b of ITI_BRANCHES) {
    let branch = await Branch.findOne({ name: b.name });
    if (!branch) {
      branch = await Branch.create({
        name: b.name,
        location: b.location,
        type: b.type || 'core',
      });
      console.log(`   ✅ Created ${b.type || 'core'} branch: ${branch.name}`);
    }
    // Backfill the Cloudinary cover image for branches without one
    const mapped = imageMap.find((m) => m.branchName === b.name && m.url);
    if (mapped && !branch.coverImage) {
      branch.coverImage = mapped.url;
      await branch.save();
      console.log(`   🖼️  Cover attached: ${branch.name}`);
    }
    entries.push({ branch, data: b });
  }
  return entries;
}

async function seedRounds(branchEntries) {
  console.log('🔄 Seeding rounds...');
  const roundsByBranch = new Map();
  for (const { branch, data } of branchEntries) {
    const rounds = [];
    for (const r of data.rounds || []) {
      let round = await Round.findOne({ branchId: branch._id, name: r.name });
      if (!round) {
        round = await Round.create({ branchId: branch._id, name: r.name, isActive: r.isActive });
        console.log(`   ✅ Created round: ${branch.name} / ${round.name}`);
      }
      rounds.push({ round, data: r });
    }
    roundsByBranch.set(branch._id.toString(), rounds);
  }
  return roundsByBranch;
}

async function seedTracks(branchEntries, roundsByBranch) {
  console.log('🎯 Seeding tracks...');
  const tracks = [];
  for (const { branch } of branchEntries) {
    const rounds = roundsByBranch.get(branch._id.toString()) || [];
    for (const { round, data } of rounds) {
      for (const trackName of data.tracks || []) {
        let track = await Track.findOne({ branchId: branch._id, roundId: round._id, name: trackName });
        if (!track) {
          const catalogEntry = trackCatalogEntry(trackName);
          track = await Track.create({
            branchId: branch._id,
            roundId: round._id,
            name: trackName,
            description: catalogEntry.description,
            category: catalogEntry.category,
          });
          console.log(`   ✅ Created track: ${branch.name} / ${round.name} / ${track.name}`);
        }
        tracks.push(track);
      }
    }
  }
  return tracks;
}

async function seedUsers(branches, tracks) {
  console.log('👥 Seeding role-based users...');

  // Super admin
  const superAdmin = await findOrCreateUser({
    email: 'superadmin@itihub.com',
    username: 'superadmin',
    fullName: 'ITI Super Admin',
    role: 'super_admin',
    specialization: 'Platform Management',
    location: 'Cairo, Egypt',
  });
  console.log('   ✅ Super admin ready: superadmin@itihub.com');

  // One branch admin per branch
  const branchAdmins = [];
  for (const branch of branches) {
    const key = slug(branch.name);
    const admin = await findOrCreateUser({
      email: `admin.${key}@itihub.com`,
      username: `admin_${key.replace(/-/g, '')}`,
      fullName: `${branch.name} Branch Admin`,
      role: 'branch_admin',
      specialization: 'Branch Management',
      location: branch.location,
    });
    // Link admin to branch if the model supports it
    if ('branchId' in admin.schema.paths && !admin.branchId) {
      admin.branchId = branch._id;
      await admin.save();
    }
    branchAdmins.push(admin);
  }
  console.log(`   ✅ Branch admins ready: ${branchAdmins.length}`);

  // Instructors: assign one per track (round-robin over a small pool).
  // Each instructor is attached to a branch (round-robin) so branch admins
  // can find and assign them via the branch-scoped user search.
  // Realistic names (not "Instructor N") so partial searches like "ahmed"
  // or "sara" actually match in the track members panel search.
  const INSTRUCTOR_NAMES = [
    'Ahmed Hassan',
    'Mohamed Salah',
    'Sara Ibrahim',
    'Mona Adel',
    'Youssef Nabil',
    'Omar Khaled',
    'Mariam Fathy',
    'Nour El Sayed',
  ];
  const INSTRUCTOR_COUNT = 8;
  const instructors = [];
  for (let i = 0; i < INSTRUCTOR_COUNT; i++) {
    const inst = await findOrCreateUser({
      email: `instructor${i + 1}@itihub.com`,
      username: `instructor${i + 1}`,
      fullName: INSTRUCTOR_NAMES[i],
      role: 'instructor',
      specialization: TRACK_NAMES[i % TRACK_NAMES.length],
      location: 'Cairo, Egypt',
    });
    // Heal legacy "Instructor N" names from earlier seedings — generic names
    // made the members-panel user search look broken (no realistic query matched).
    if (/^Instructor \d+$/.test(inst.fullName || '')) {
      inst.fullName = INSTRUCTOR_NAMES[i];
      await inst.save();
    }
    const instBranch = branches[i % branches.length];
    if ('branchId' in inst.schema.paths && !inst.branchId && instBranch) {
      inst.branchId = instBranch._id;
      await inst.save();
    }
    instructors.push(inst);
  }
  console.log(`   ✅ Instructors ready: ${instructors.length}`);

  // Students (also attached to branches round-robin)
  const STUDENT_COUNT = 12;
  const students = [];
  for (let i = 0; i < STUDENT_COUNT; i++) {
    const st = await findOrCreateUser({
      email: `student${i + 1}@itihub.com`,
      username: `student${i + 1}`,
      fullName: `Student ${i + 1}`,
      role: 'student',
      specialization: TRACK_NAMES[i % TRACK_NAMES.length],
      location: 'Egypt',
    });
    const stBranch = branches[i % branches.length];
    if ('branchId' in st.schema.paths && !st.branchId && stBranch) {
      st.branchId = stBranch._id;
      await st.save();
    }
    students.push(st);
  }
  console.log(`   ✅ Students ready: ${students.length}`);

  // Assign instructors + students to tracks and sync User.trackIds
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const instructor = instructors[i % instructors.length];
    const memberStudents = [students[i % students.length], students[(i + 1) % students.length]];

    track.instructorIds.addToSet(instructor._id);
    for (const st of memberStudents) track.studentIds.addToSet(st._id);
    await track.save();

    // Sync denormalized trackIds on users
    for (const member of [instructor, ...memberStudents]) {
      member.trackIds.addToSet(track._id);
      await member.save();
    }
  }
  console.log('   ✅ Track membership assigned');

  return { superAdmin, branchAdmins, instructors, students };
}

async function seedGroups(branches, users) {
  console.log('🏘️  Seeding community groups...');
  const createdBy = users.superAdmin;
  for (const g of ITI_GROUPS) {
    let group = await CommunityGroup.findOne({ name: g.name });
    if (!group) {
      group = await CommunityGroup.create({
        name: g.name,
        specialization: g.specialization,
        description: g.description,
        createdBy: createdBy._id,
      });
      console.log(`   ✅ Created group: ${group.name}`);
    } else if (String(group.createdBy) !== String(createdBy._id)) {
      // Repair groups seeded by a previous run whose creator user was
      // wiped in a later re-seed (dangling ref → populate returns null,
      // which breaks admin-only moderation of these groups).
      group.createdBy = createdBy._id;
      await group.save();
      console.log(`   🔧 Repaired group creator: ${group.name}`);
    }
  }
}

async function seedJobs(users) {
  console.log('💼 Seeding jobs...');
  const postedBy = users.superAdmin;
  for (const j of ITI_JOBS) {
    let job = await Job.findOne({ title: j.title, company: j.company });
    if (!job) {
      job = await Job.create({
        title: j.title,
        company: j.company,
        location: j.location,
        description: j.description,
        tags: j.tags,
        applyUrl: j.applyUrl,
        postedBy: postedBy._id,
      });
      console.log(`   ✅ Created job: ${job.title} @ ${job.company}`);
    }
  }
}

async function seedEvents(branches, users) {
  console.log('📅 Seeding events...');
  const createdBy = users.superAdmin;
  for (const e of ITI_EVENTS) {
    // Match by title only: seed dates are relative (daysFromNow) so they change each run
    let event = await Event.findOne({ title: e.title });
    if (!event) {
      event = await Event.create({
        title: e.title,
        description: e.description,
        location: e.location,
        date: e.date,
        registerUrl: e.registerUrl,
        branchIds: branches.length ? [branches[0]._id] : [],
        createdBy: createdBy._id,
      });
      console.log(`   ✅ Created event: ${event.title}`);
    }
  }
}

async function run() {
  try {
    console.log('🚀 Seeding ITI structure (idempotent)...\n');
    await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');
    console.log('✅ MongoDB connected\n');

    const branchEntries = await seedBranches();
    const branches = branchEntries.map((e) => e.branch);
    const roundsByBranch = await seedRounds(branchEntries);
    const tracks = await seedTracks(branchEntries, roundsByBranch);
    const users = await seedUsers(branches, tracks);
    await seedGroups(branches, users);
    await seedJobs(users);
    await seedEvents(branches, users);

    console.log('\n🎉 ITI structure seeding completed.');
    console.log('   🔐 Default password for seeded users: ' + DEFAULT_PASSWORD);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

run();