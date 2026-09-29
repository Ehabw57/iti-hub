/**
 * Admin dashboard connectivity verification (checklist items 1–6 from the
 * "Branches & Tracks Seed Data Reference" doc).
 *
 * Exercises the exact HTTP endpoints the Angular admin dashboard calls,
 * as both super_admin and a branch_admin, against a live server + real DB.
 * All temporary data created here is cleaned up at the end.
 *
 * Usage:
 *   node scripts/verifyAdminConnectivity.js [baseUrl]   # default http://localhost:3999
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Branch = require('../models/Branch');
const Round = require('../models/Round');
const Track = require('../models/Track');
const User = require('../models/User');

const BASE = process.argv[2] || 'http://localhost:3999';
const PASSWORD = 'User123!';

const results = [];
function check(item, name, cond, detail = '') {
  results.push({ item, name, pass: !!cond, detail });
  console.log(`   ${cond ? '✅' : '❌'} [${item}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

async function login(email) {
  const res = await api('POST', '/auth/login', { body: { email, password: PASSWORD } });
  if (res.status !== 200 || !res.json?.data?.token) {
    throw new Error(`Login failed for ${email}: HTTP ${res.status} ${res.text.slice(0, 200)}`);
  }
  return { token: res.json.data.token, user: res.json.data.user };
}

async function main() {
  console.log(`\n🛠️  Admin dashboard connectivity verification against ${BASE}\n`);
  await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');

  // ---------- Actors & fixtures ----------
  const superAdmin = await login('superadmin@itihub.com');
  const alexBranch = await Branch.findOne({ name: 'Alexandria' });
  const svBranch = await Branch.findOne({ name: 'Smart Village (HQ)' });
  if (!alexBranch || !svBranch) throw new Error('Seeded branches not found. Run seedItiStructure.js first.');

  const alexAdmin = await login('admin.alexandria@itihub.com');
  console.log(`   Actors: super_admin + branch_admin of "${alexBranch.name}"\n`);

  // ---------- Prerequisite: /admin stats accept super_admin ----------
  console.log('━━━ Prerequisite: platform admin endpoints accept super_admin ━━━');
  const stats = await api('GET', '/api/admin/statistics/overview', { token: superAdmin.token });
  check('0', 'GET /admin/statistics/overview as super_admin (200)', stats.status === 200, `got ${stats.status}`);

  // ---------- Item 1: branches list reflects DB immediately ----------
  console.log('\n━━━ Item 1: Branch list reflects DB (create → visible immediately) ━━━');
  const tempBranchName = `Verify Temp Branch ${Date.now()}`;
  const createBranchRes = await api('POST', '/branches', {
    token: superAdmin.token,
    body: { name: tempBranchName, location: 'Verification test', type: 'extension' },
  });
  const tempBranchId = createBranchRes.json?.data?.branch?._id;
  check('1', 'Create branch via dashboard API (201)', createBranchRes.status === 201 && !!tempBranchId, `got ${createBranchRes.status}`);

  const listRes = await api('GET', '/branches');
  const listed = (listRes.json?.data?.branches || []).find((b) => b._id === tempBranchId);
  check('1', 'New branch appears immediately in GET /branches', !!listed);
  check('1', 'Branch carries its type (extension)', listed?.type === 'extension', `type=${listed?.type}`);

  // ---------- Item 2: round management ----------
  console.log('\n━━━ Item 2: Round management (create / edit / close) ━━━');
  const r1 = await api('POST', `/branches/${tempBranchId}/rounds`, {
    token: superAdmin.token,
    body: { name: 'Verify Round', isActive: true },
  });
  const tempRoundId = r1.json?.data?.round?._id;
  check('2', 'Super admin creates a round (201)', r1.status === 201 && !!tempRoundId, `got ${r1.status}`);

  const r2 = await api('PATCH', `/rounds/${tempRoundId}`, {
    token: superAdmin.token,
    body: { name: 'Verify Round Renamed' },
  });
  check('2', 'Super admin edits the round (200)', r2.status === 200 && r2.json?.data?.round?.name === 'Verify Round Renamed');

  const r3 = await api('PATCH', `/rounds/${tempRoundId}`, {
    token: superAdmin.token,
    body: { isActive: false },
  });
  check('2', 'Super admin closes the round (isActive=false)', r3.status === 200 && r3.json?.data?.round?.isActive === false);
  await api('PATCH', `/rounds/${tempRoundId}`, { token: superAdmin.token, body: { isActive: true } });

  const ownRoundRes = await api('POST', `/branches/${alexBranch._id}/rounds`, {
    token: alexAdmin.token,
    body: { name: `Alex Verify Round ${Date.now()}`, isActive: false },
  });
  const ownRoundId = ownRoundRes.json?.data?.round?._id;
  check('2', 'Branch admin creates a round in their OWN branch (201)', ownRoundRes.status === 201, `got ${ownRoundRes.status}`);

  // ---------- Item 3: track created from dashboard appears publicly ----------
  console.log('\n━━━ Item 3: Track created in dashboard appears in public browse ━━━');
  const t1 = await api('POST', `/rounds/${tempRoundId}/tracks`, {
    token: superAdmin.token,
    body: { name: 'Verify Track', description: 'Temporary verification track' },
  });
  const tempTrackId = t1.json?.data?.track?._id;
  check('3', 'Create track under the round (201)', t1.status === 201 && !!tempTrackId, `got ${t1.status}`);

  const publicTracks = await api('GET', `/rounds/${tempRoundId}/tracks`); // no token: public browse
  const publiclyVisible = (publicTracks.json?.data?.tracks || []).some((t) => t._id === tempTrackId);
  check('3', 'Track visible immediately via public GET /rounds/:id/tracks', publicTracks.status === 200 && publiclyVisible);

  // ---------- Item 4: member assignment propagation ----------
  console.log('\n━━━ Item 4: Member assignment propagates everywhere ━━━');
  const instructor = await User.findOne({ role: 'instructor' });
  const student = await User.findOne({ role: 'student' });

  const m1 = await api('PATCH', `/tracks/${tempTrackId}/members`, {
    token: superAdmin.token,
    body: { addInstructors: [String(instructor._id)], addStudents: [String(student._id)] },
  });
  check('4', 'Assign instructor + student via dashboard API (200)', m1.status === 200, `got ${m1.status}`);

  const trackDoc = await Track.findById(tempTrackId);
  check(
    '4',
    '(a) Track.instructorIds / studentIds updated',
    trackDoc.instructorIds.some((id) => String(id) === String(instructor._id)) &&
    trackDoc.studentIds.some((id) => String(id) === String(student._id))
  );

  const instDoc = await User.findById(instructor._id);
  const stuDoc = await User.findById(student._id);
  check(
    '4',
    '(b) User.trackIds updated on both users',
    instDoc.trackIds.some((id) => String(id) === String(tempTrackId)) &&
    stuDoc.trackIds.some((id) => String(id) === String(tempTrackId))
  );

  const instSession = await login(instructor.email);
  const meRes = await api('GET', '/users/me', { token: instSession.token });
  const myTracks = meRes.json?.trackIds || [];
  check(
    '4',
    '(c) Instructor sees the track in their own profile (/users/me trackIds)',
    myTracks.some((id) => String(id) === String(tempTrackId))
  );

  // ---------- Item 5: deletion propagation (cascade, no orphaned references) ----------
  console.log('\n━━━ Item 5: Cascade deletion (no orphaned references) ━━━');

  // 5a. Round cascade: deleting the round removes its track + cleans user refs
  const d1 = await api('DELETE', `/rounds/${tempRoundId}`, { token: superAdmin.token });
  const roundGone = !(await Round.findById(tempRoundId));
  const trackGoneAfterRound = !(await Track.findById(tempTrackId));
  const instAfterRound = await User.findById(instructor._id);
  const stuAfterRound = await User.findById(student._id);
  const refsCleanedAfterRound =
    !instAfterRound.trackIds.some((id) => String(id) === String(tempTrackId)) &&
    !stuAfterRound.trackIds.some((id) => String(id) === String(tempTrackId));
  check(
    '5',
    'Round delete cascades: round + its track removed, User.trackIds cleaned',
    d1.status === 200 && roundGone && trackGoneAfterRound && refsCleanedAfterRound,
    `got ${d1.status}, removed=${JSON.stringify(d1.json?.data?.removed)}`
  );

  // 5b. Branch cascade: rebuild round + track under the temp branch, then
  // delete the branch and confirm everything underneath is removed too.
  const r4 = await api('POST', `/branches/${tempBranchId}/rounds`, {
    token: superAdmin.token,
    body: { name: 'Cascade Verify Round', isActive: true },
  });
  const cascadeRoundId = r4.json?.data?.round?._id;
  const t2 = await api('POST', `/rounds/${cascadeRoundId}/tracks`, {
    token: superAdmin.token,
    body: { name: 'Cascade Verify Track' },
  });
  const cascadeTrackId = t2.json?.data?.track?._id;
  await api('PATCH', `/tracks/${cascadeTrackId}/members`, {
    token: superAdmin.token,
    body: { addInstructors: [String(instructor._id)], addStudents: [String(student._id)] },
  });

  const d2 = await api('DELETE', `/branches/${tempBranchId}`, { token: superAdmin.token });
  const branchGone = !(await Branch.findById(tempBranchId));
  const cascadeRoundGone = !(await Round.findById(cascadeRoundId));
  const cascadeTrackGone = !(await Track.findById(cascadeTrackId));
  const instAfterBranch = await User.findById(instructor._id);
  const stuAfterBranch = await User.findById(student._id);
  const refsCleanedAfterBranch =
    !instAfterBranch.trackIds.some((id) => String(id) === String(cascadeTrackId)) &&
    !stuAfterBranch.trackIds.some((id) => String(id) === String(cascadeTrackId));
  check(
    '5',
    'Branch delete cascades: branch + round + track removed, User.trackIds cleaned',
    d2.status === 200 && branchGone && cascadeRoundGone && cascadeTrackGone && refsCleanedAfterBranch,
    `got ${d2.status}, removed=${JSON.stringify(d2.json?.data?.removed)}`
  );

  // 5c. Track-level delete still cleans up refs (direct track delete path)
  const r5 = await api('POST', `/branches/${alexBranch._id}/rounds`, {
    token: superAdmin.token,
    body: { name: 'Track Delete Verify Round', isActive: false },
  });
  const t3 = await api('POST', `/rounds/${r5.json?.data?.round?._id}/tracks`, {
    token: superAdmin.token,
    body: { name: 'Track Delete Verify Track' },
  });
  const directTrackId = t3.json?.data?.track?._id;
  await api('PATCH', `/tracks/${directTrackId}/members`, {
    token: superAdmin.token,
    body: { addStudents: [String(student._id)] },
  });
  const d3 = await api('DELETE', `/tracks/${directTrackId}`, { token: superAdmin.token });
  const stuAfterTrack = await User.findById(student._id);
  check(
    '5',
    'Direct track delete succeeds (200) and clears User.trackIds refs',
    d3.status === 200 &&
      !(await Track.findById(directTrackId)) &&
      !stuAfterTrack.trackIds.some((id) => String(id) === String(directTrackId)),
    `got ${d3.status}`
  );
  // cleanup the leftover verify round
  await api('DELETE', `/rounds/${r5.json?.data?.round?._id}`, { token: superAdmin.token });

  // ---------- Item 6: branch admin permission boundaries ----------
  console.log('\n━━━ Item 6: Branch admin permission boundaries ━━━');
  const p1 = await api('POST', `/branches/${svBranch._id}/rounds`, {
    token: alexAdmin.token,
    body: { name: 'Should Be Rejected', isActive: false },
  });
  check('6', 'Branch admin CANNOT create rounds in another branch (403)', p1.status === 403, `got ${p1.status}`);

  const svRound = await Round.findOne({ branchId: svBranch._id });
  const p2 = await api('PATCH', `/rounds/${svRound._id}`, {
    token: alexAdmin.token,
    body: { name: 'Should Be Rejected' },
  });
  check('6', 'Branch admin CANNOT edit rounds of another branch (403)', p2.status === 403, `got ${p2.status}`);

  const p3 = await api('POST', '/branches', {
    token: alexAdmin.token,
    body: { name: 'Should Be Rejected Branch', location: 'x', type: 'core' },
  });
  check('6', 'Branch admin CANNOT create branches (403)', p3.status === 403, `got ${p3.status}`);

  const p4 = await api('PATCH', `/rounds/${ownRoundId}`, {
    token: alexAdmin.token,
    body: { name: 'Alex Verify Round Edited' },
  });
  check('6', 'Branch admin CAN edit rounds of their own branch (200)', p4.status === 200, `got ${p4.status}`);

  // Cleanup the branch admin's temp round
  await api('DELETE', `/rounds/${ownRoundId}`, { token: alexAdmin.token });

  // ---------- Summary ----------
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${'='.repeat(64)}`);
  console.log(`RESULT: ${passed}/${results.length} checks passed`);
  console.log('='.repeat(64));

  await mongoose.disconnect();
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(async (err) => {
  console.error('❌ Verification crashed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
