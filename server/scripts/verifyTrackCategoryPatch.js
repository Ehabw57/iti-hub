/**
 * Live validation of the Track-category feature on PATCH /tracks/:id.
 * (real server + real DB + JWT auth; mongoose only for fixture discovery
 * and cleanup verification — smokeTest.js conventions)
 *
 * Checks:
 *   1. Each enum category PATCHes to 200 and persists in the DB
 *   2. Bogus / non-string categories → 400 VALIDATION_ERROR
 *   3. PATCH without `category` leaves it untouched (partial update)
 *   4. Guards: 401 (no token), 403 (student), 400 (bad id), 404 (unknown id)
 *   5. Temp track deleted via API afterwards (seeded data untouched)
 *
 * Usage: node scripts/verifyTrackCategoryPatch.js [baseUrl]  # default http://localhost:3999
 * DB_URL env var selects the fixture DB (default mongodb://127.0.0.1:27017/iti-hub)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Round = require('../models/Round');
const Track = require('../models/Track');
const User = require('../models/User');

const BASE = process.argv[2] || 'http://localhost:3999';
const PASSWORD = 'User123!';

/** Single source of truth: the Track model enum (mirrors trackAdminController). */
const TRACK_CATEGORIES = Track.schema.path('category').enumValues;

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`   ${cond ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** HTTP helper. Returns { status, json, text }. */
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
  try { json = JSON.parse(text); } catch { /* non-JSON response */ }
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
  console.log(`\n🏷️  Track-category PATCH validation against ${BASE}\n`);
  await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');

  // ---------- Actor discovery ----------
  const adminDoc = await User.findOne({ role: { $in: ['super_admin', 'admin'] }, isBlocked: { $ne: true } });
  if (!adminDoc) {
    const info = await mongoose.connection.db.admin().command({ listDatabases: 1 });
    throw new Error(
      `No admin user in db "${mongoose.connection.name}" at ${mongoose.connection.host}:${mongoose.connection.port}. ` +
        `Databases on this mongod: ${info.databases.map((d) => d.name).join(', ')}`
    );
  }
  const superAdmin = await login(adminDoc.email);
  console.log(`   Actor: ${adminDoc.email} (${adminDoc.role})`);

  // ---------- Fixture: temp track via the API (seeded data untouched) ----------
  let round = await Round.findOne();
  let tempBranchId = null;
  if (!round) {
    const b = await api('POST', '/branches', {
      token: superAdmin.token,
      body: { name: `Category Verify Branch ${Date.now()}`, location: 'Live test', type: 'extension' },
    });
    tempBranchId = b.json?.data?.branch?._id;
    if (!tempBranchId) throw new Error(`Temp branch creation failed: HTTP ${b.status} ${b.text.slice(0, 200)}`);
    const r = await api('POST', `/branches/${tempBranchId}/rounds`, {
      token: superAdmin.token,
      body: { name: 'Category Verify Round', isActive: false },
    });
    const roundId = r.json?.data?.round?._id;
    if (!roundId) throw new Error(`Temp round creation failed: HTTP ${r.status} ${r.text.slice(0, 200)}`);
    round = await Round.findById(roundId);
  }
  if (!round) throw new Error('No round available to host the temp track');

  const created = await api('POST', `/rounds/${round._id}/tracks`, {
    token: superAdmin.token,
    body: { name: 'Category Verify Temp Track', description: 'PATCH category live test' },
  });
  const trackId = created.json?.data?.track?._id;
  if (created.status !== 201 || !trackId) {
    throw new Error(`Temp track creation failed: HTTP ${created.status} ${created.text.slice(0, 300)}`);
  }
  console.log(`   Fixture: temp track ${trackId} in round "${round.name}"\n`);

  const trackUrl = (id) => `/tracks/${id ?? trackId}`;

  // ==================================================================
  // 1. Valid categories — every enum value round-trips and persists
  // ==================================================================
  console.log('━━━ 1. Valid categories round-trip ━━━');
  for (const category of TRACK_CATEGORIES) {
    const res = await api('PATCH', trackUrl(), { token: superAdmin.token, body: { category } });
    const inBody = res.json?.data?.track?.category === category;
    const inDb = (await Track.findById(trackId))?.category === category;
    check(`PATCH { category: '${category}' } → 200 + persisted`,
      res.status === 200 && res.json?.success === true && inBody && inDb,
      `HTTP ${res.status}, body=${inBody}, db=${inDb}`);
  }

  // ==================================================================
  // 2. Invalid categories → 400 VALIDATION_ERROR
  // ==================================================================
  console.log('\n━━━ 2. Invalid categories rejected ━━━');
  const badValues = ['Bogus Category', 42, null];
  for (const bad of badValues) {
    const res = await api('PATCH', trackUrl(), { token: superAdmin.token, body: { category: bad } });
    const err = res.json?.error;
    const ok =
      res.status === 400 &&
      err?.code === 'VALIDATION_ERROR' &&
      typeof err?.message === 'string' &&
      err.message.startsWith('Invalid category. Allowed values:') &&
      TRACK_CATEGORIES.every((c) => err.message.includes(c));
    check(`PATCH { category: ${JSON.stringify(bad)} } → 400 VALIDATION_ERROR`, ok,
      ok ? '' : `got HTTP ${res.status}: ${res.text.slice(0, 160)}`);
  }

  // ==================================================================
  // 3. Partial update: no `category` key leaves it untouched
  // ==================================================================
  console.log('\n━━━ 3. Partial update keeps category ━━━');
  const before = (await Track.findById(trackId)).category;
  const noCat = await api('PATCH', trackUrl(), {
    token: superAdmin.token,
    body: { description: 'touched without category' },
  });
  const after = (await Track.findById(trackId)).category;
  check('PATCH without category → 200 and category unchanged',
    noCat.status === 200 && after === before,
    `HTTP ${noCat.status}, "${before}" → "${after}"`);

  // ==================================================================
  // 4. Auth & permission guards
  // ==================================================================
  console.log('\n━━━ 4. Auth & permission guards ━━━');
  const anon = await api('PATCH', trackUrl(), { body: { category: 'Web Development' } });
  check('PATCH without token → 401',
    anon.status === 401 && anon.json?.error?.code === 'NO_TOKEN',
    `got ${anon.status} ${anon.json?.error?.code ?? ''}`);

  const studentDoc = await User.findOne({ role: 'student', isBlocked: { $ne: true } });
  if (studentDoc) {
    try {
      const student = await login(studentDoc.email);
      const forb = await api('PATCH', trackUrl(), {
        token: student.token,
        body: { category: 'Web Development' },
      });
      check(`PATCH as student (${studentDoc.username}) → 403`,
        forb.status === 403 && forb.json?.error?.code === 'FORBIDDEN',
        `got ${forb.status}`);
    } catch (e) {
      check('PATCH as student → 403', false, `login failed: ${e.message}`);
    }
  } else {
    console.log('   ⏭️  Skipped student 403 check — no student user in DB');
  }

  // ==================================================================
  // 5. ID guards
  // ==================================================================
  console.log('\n━━━ 5. ID guards ━━━');
  const malformed = await api('PATCH', trackUrl('not-an-object-id'), {
    token: superAdmin.token,
    body: { category: 'Others' },
  });
  check('PATCH /tracks/not-an-object-id → 400 Invalid track ID',
    malformed.status === 400 && malformed.json?.error?.message === 'Invalid track ID',
    `got ${malformed.status}`);

  const ghostId = new mongoose.Types.ObjectId();
  const ghost = await api('PATCH', trackUrl(ghostId), {
    token: superAdmin.token,
    body: { category: 'Others' },
  });
  check('PATCH unknown-but-valid id → 404 Track not found',
    ghost.status === 404 && ghost.json?.error?.code === 'TRACK_NOT_FOUND',
    `got ${ghost.status}`);

  // ==================================================================
  // CLEANUP — leave the DB as we found it
  // ==================================================================
  console.log('\n━━━ Cleanup ━━━');
  const del = await api('DELETE', trackUrl(), { token: superAdmin.token });
  const gone = !(await Track.findById(trackId));
  console.log(`   🧹 Deleted temp track via API: HTTP ${del.status}${gone ? '' : ' (STILL PRESENT!)'}`);
  if (tempBranchId) {
    const db = await api('DELETE', `/branches/${tempBranchId}`, { token: superAdmin.token });
    console.log(`   🧹 Deleted temp branch (+rounds/tracks cascade): HTTP ${db.status}`);
  }

  // ==================================================================
  // SUMMARY
  // ==================================================================
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('\n══════════════════════════════════════');
  console.log(`📊 CATEGORY PATCH VALIDATION: ${passed}/${results.length} passed, ${failed} failed`);
  if (!gone) console.log('   ⚠️  temp track could not be deleted — manual cleanup needed');
  console.log('══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exitCode = failed > 0 || !gone ? 1 : 0;
}

main().catch(async (err) => {
  console.error('\n💥 Category PATCH validation crashed:', err.message);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exitCode = 2;
});
