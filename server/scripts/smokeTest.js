/**
 * End-to-end smoke test for the core course flows (real server + real DB).
 *
 * Flows tested (as real user journeys over HTTP):
 *   1. A student requests enrollment, a track manager approves it, and the
 *      student gains access to files/videos (access is denied BEFORE the
 *      approval and while the request is pending).
 *   2. An instructor adds a video; students see it; a student marks it as
 *      reviewed; the leaderboard reflects the progress.
 *   3. Track chat: a member posts a message, another member reads it,
 *      a non-member is rejected, and the poster deletes the message.
 *   4. Multipart file upload by an instructor (requires Cloudinary creds —
 *      the real outcome is reported honestly).
 *   5. Track workspace extras: folders and records (Teams links) CRUD.
 *
 * Mongoose is used ONLY for deterministic fixture selection and cleanup;
 * every flow step goes through the HTTP API with JWT auth.
 *
 * Usage:
 *   node scripts/smokeTest.js [baseUrl]     # default http://localhost:3999
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Track = require('../models/Track');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const EnrollmentRequest = require('../models/EnrollmentRequest');
const Notification = require('../models/Notification');
const TrackItemReview = require('../models/TrackItemReview');
const TrackChatMessage = require('../models/TrackChatMessage');
const TrackRecord = require('../models/TrackRecord');
const TrackFolder = require('../models/TrackFolder');
const CourseVideo = require('../models/CourseVideo');
const CourseFile = require('../models/CourseFile');

const BASE = process.argv[2] || 'http://localhost:3999';
const PASSWORD = 'User123!';

const results = [];
function check(flow, name, cond, detail = '') {
  results.push({ flow, name, pass: !!cond, detail });
  console.log(`   ${cond ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** HTTP helper. Returns { status, json, text }. */
async function api(method, path, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData; // fetch sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
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
  console.log(`\n🔥 ITI Hub smoke test against ${BASE}\n`);

  await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');

  // ---------- Fixture selection (DB read-only) ----------
  const track = await Track.findOne({ instructorIds: { $exists: true, $not: { $size: 0 } } })
    .sort({ createdAt: 1 });
  if (!track) throw new Error('No seeded track with an instructor found. Run seedItiStructure.js first.');

  const instructor = await User.findById(track.instructorIds[0]);
  const memberStudent = await User.findById(track.studentIds[0]);

  // Two students NOT in this track and not enrolled in it (fresh outsiders)
  const outsiders = await User.find({
    role: 'student',
    _id: { $nin: track.studentIds },
  }).limit(10);
  const freshOutsiders = [];
  for (const o of outsiders) {
    const enrolled = await Enrollment.findOne({ user_id: o._id, track_id: track._id });
    if (!enrolled) freshOutsiders.push(o);
    if (freshOutsiders.length === 2) break;
  }
  if (freshOutsiders.length < 2) throw new Error('Not enough outsider students for the test');
  const [newStudent, outsiderStudent] = freshOutsiders;

  // A manager authorized to approve enrollment requests for this track:
  // the branch admin of the track's branch, falling back to the super admin.
  const manager =
    (await User.findOne({ role: 'branch_admin', branchId: track.branchId })) ||
    (await User.findOne({ role: 'super_admin' }));
  if (!manager) throw new Error('No branch admin or super admin found to approve requests');

  console.log(`📌 Fixture track : ${track.name} (${track._id})`);
  console.log(`📌 Instructor    : ${instructor.email}`);
  console.log(`📌 Member student: ${memberStudent.email}`);
  console.log(`📌 Fresh student : ${newStudent.email} (will request + get approved)`);
  console.log(`📌 Outsider      : ${outsiderStudent.email} (must be rejected)`);
  console.log(`📌 Approver      : ${manager.email}\n`);

  const created = { videoId: null, chatMsgId: null, fileId: null, requestId: null, recordId: null, folderId: null, outsiderRequestId: null, outsiderRequestId2: null };

  // ==================================================================
  // FLOW 0 — Corrected route structure (independent top-level modules)
  // ==================================================================
  console.log('--- Flow 0: Route structure (branches / rounds / tracks / community) ---');

  const branchesRes = await api('GET', '/branches');
  const branchesList = branchesRes.json?.data?.branches ?? [];
  check(
    'F0',
    'GET /branches returns 11 branches (200)',
    branchesRes.status === 200 && branchesList.length === 11,
    `got ${branchesRes.status}, count=${branchesList.length}`
  );

  const coreCount = branchesList.filter((b) => b.type === 'core').length;
  const extensionCount = branchesList.filter((b) => b.type === 'extension').length;
  check(
    'F0',
    'Branches carry type: 6 core + 5 extension',
    coreCount === 6 && extensionCount === 5,
    `core=${coreCount}, extension=${extensionCount}`
  );

  const roundIds = [];
  for (const b of branchesList) {
    const roundsRes = await api('GET', `/branches/${b._id}/rounds`);
    const rounds = roundsRes.json?.data?.rounds ?? [];
    if (roundsRes.status !== 200) {
      check('F0', `GET /branches/:id/rounds for ${b.name} (200)`, false, `got ${roundsRes.status}`);
    }
    roundIds.push(...rounds.map((r) => r._id));
  }
  check('F0', 'Branches expose 17 rounds total via /branches/:id/rounds', roundIds.length === 17, `count=${roundIds.length}`);

  let trackCount = 0;
  for (const roundId of roundIds) {
    const tracksRes = await api('GET', `/rounds/${roundId}/tracks`);
    const tracks = tracksRes.json?.data?.tracks ?? [];
    if (tracksRes.status !== 200) {
      check('F0', 'GET /rounds/:roundId/tracks (200)', false, `got ${tracksRes.status}`);
    }
    trackCount += tracks.length;
  }
  check('F0', 'Rounds expose 43 tracks total via /rounds/:roundId/tracks', trackCount === 43, `count=${trackCount}`);

  const member = await login(memberStudent.email);
  const groupsRes = await api('GET', '/community/groups', { token: member.token });
  const groupsList = groupsRes.json?.data?.groups ?? [];
  check(
    'F0',
    'GET /community/groups returns 5 groups (200)',
    groupsRes.status === 200 && groupsList.length === 5,
    `got ${groupsRes.status}, count=${groupsList.length}`
  );

  const legacyRes = await api('GET', '/courses/branches');
  check('F0', 'Legacy /courses/* prefix is gone (404)', legacyRes.status === 404, `got ${legacyRes.status}`);


  // ==================================================================
  // FLOW 1 - Student requests enrollment; manager approves; access opens
  // ==================================================================
  console.log('\n--- Flow 1: Enroll request -> manager approval -> access ---');
  const stu = await login(newStudent.email);

  const before = await api('GET', `/tracks/${track._id}/files`, { token: stu.token });
  check('F1', 'Files are blocked before approval (403)', before.status === 403, `got ${before.status}`);

  const legacyEnroll = await api('POST', '/tracks/enroll', {
    token: stu.token,
    body: { trackId: String(track._id), branchId: String(track.branchId) },
  });
  check('F1', 'Instant-enroll endpoint is gone (404)', legacyEnroll.status === 404, `got ${legacyEnroll.status}`);

  const mgr = await login(manager.email);

  const reqRes = await api('POST', '/tracks/enroll-requests', {
    token: stu.token,
    body: { trackId: String(track._id), branchId: String(track.branchId) },
  });
  created.requestId = reqRes.json?.data?.request?._id;
  check(
    'F1',
    'POST /tracks/enroll-requests creates a pending request (201)',
    reqRes.status === 201 && reqRes.json?.data?.request?.status === 'pending',
    `got ${reqRes.status}: ${reqRes.json?.error?.message || reqRes.text.slice(0, 120)}`
  );

  const dupeReq = await api('POST', '/tracks/enroll-requests', {
    token: stu.token,
    body: { trackId: String(track._id), branchId: String(track.branchId) },
  });
  check('F1', 'Duplicate pending request is rejected (409)', dupeReq.status === 409, `got ${dupeReq.status}`);

  const pendingFiles = await api('GET', `/tracks/${track._id}/files`, { token: stu.token });
  check('F1', 'Files still blocked while request is pending (403)', pendingFiles.status === 403, `got ${pendingFiles.status}`);

  const myCheck = await api('GET', `/tracks/check-enrollment?trackId=${track._id}`, { token: stu.token });
  check(
    'F1',
    'check-enrollment exposes the pending request',
    myCheck.status === 200 && myCheck.json?.data?.pendingRequest?._id === created.requestId,
    `got ${myCheck.status}`
  );

  const outsiderQueue = await api('GET', `/tracks/${track._id}/enroll-requests`, { token: stu.token });
  check('F1', 'Non-manager cannot list the review queue (403)', outsiderQueue.status === 403, `got ${outsiderQueue.status}`);

  const queue = await api('GET', `/tracks/${track._id}/enroll-requests?status=pending`, { token: mgr.token });
  const queued = (queue.json?.data?.requests || []).some(
    (r) => String(r._id) === String(created.requestId)
  );
  check(
    'F1',
    'Manager sees the pending request in the queue',
    queue.status === 200 && queued,
    `got ${queue.status}`
  );

  const studentDecide = await api('PATCH', `/tracks/enroll-requests/${created.requestId}/decision`, {
    token: stu.token,
    body: { decision: 'approved' },
  });
  check('F1', 'Student cannot approve own request (403)', studentDecide.status === 403, `got ${studentDecide.status}`);

  const approveRes = await api('PATCH', `/tracks/enroll-requests/${created.requestId}/decision`, {
    token: mgr.token,
    body: { decision: 'approved' },
  });
  check(
    'F1',
    'Manager approves the request (200 -> approved)',
    approveRes.status === 200 && approveRes.json?.data?.request?.status === 'approved',
    `got ${approveRes.status}: ${approveRes.json?.error?.message || ''}`
  );

  const notif = await Notification.findOne({
    recipient: newStudent._id,
    type: 'enrollment_approved',
    target: track._id,
  }).lean();
  check('F1', 'Requester got an enrollment_approved notification', !!notif);

  const myEnroll = await api('GET', '/tracks/my-enrollments', { token: stu.token });
  check(
    'F1',
    'My enrollments include the track',
    myEnroll.status === 200 && JSON.stringify(myEnroll.json).includes(String(track._id)),
    `got ${myEnroll.status}`
  );

  const filesAfter = await api('GET', `/tracks/${track._id}/files`, { token: stu.token });
  check('F1', 'Files accessible after approval (200)', filesAfter.status === 200, `got ${filesAfter.status}`);

  const videosAfter = await api('GET', `/tracks/${track._id}/videos`, { token: stu.token });
  check('F1', 'Videos accessible after approval (200)', videosAfter.status === 200, `got ${videosAfter.status}`);

  // Rejected student can re-request (spec §4: rejected → re-request works)
  const rej = await login(outsiderStudent.email);
  const rejReq = await api('POST', '/tracks/enroll-requests', {
    token: rej.token,
    body: { trackId: String(track._id), branchId: String(track.branchId) },
  });
  created.outsiderRequestId = rejReq.json?.data?.request?._id;
  check(
    'F1',
    'Outsider can submit a request (201)',
    rejReq.status === 201 && !!created.outsiderRequestId,
    `got ${rejReq.status}`
  );

  const rejDecide = await api('PATCH', `/tracks/enroll-requests/${created.outsiderRequestId}/decision`, {
    token: mgr.token,
    body: { decision: 'rejected' },
  });
  check(
    'F1',
    'Manager rejects the request (200 -> rejected)',
    rejDecide.status === 200 && rejDecide.json?.data?.request?.status === 'rejected',
    `got ${rejDecide.status}`
  );

  const rejNotif = await Notification.findOne({
    recipient: outsiderStudent._id,
    type: 'enrollment_rejected',
    target: track._id,
  }).lean();
  check('F1', 'Rejected requester got an enrollment_rejected notification', !!rejNotif);

  const reReq = await api('POST', '/tracks/enroll-requests', {
    token: rej.token,
    body: { trackId: String(track._id), branchId: String(track.branchId) },
  });
  created.outsiderRequestId2 = reReq.json?.data?.request?._id;
  check(
    'F1',
    'Rejected student can re-request (201)',
    reReq.status === 201 && !!created.outsiderRequestId2,
    `got ${reReq.status}: ${reReq.json?.error?.message || ''}`
  );


  // ==================================================================
  // FLOW 2 — Instructor adds a video; student reviews it; leaderboard
  // ==================================================================
  console.log('\n━━━ Flow 2: Instructor adds video → student progress ━━━');
  const inst = await login(instructor.email);

  const videoTitle = `Smoke Test Video ${Date.now()}`;
  const addVideoRes = await api('POST', `/tracks/${track._id}/videos`, {
    token: inst.token,
    body: {
      title: videoTitle,
      videoUrl: 'https://www.youtube.com/watch?v=smoke-test-001',
      description: 'Created by the automated smoke test',
      durationSeconds: 600,
    },
  });
  created.videoId = addVideoRes.json?.data?.video?._id;
  check('F2', 'Instructor adds a video (201)', addVideoRes.status === 201 && !!created.videoId, `got ${addVideoRes.status}`);

  const studentVideos = await api('GET', `/tracks/${track._id}/videos`, { token: stu.token });
  const seesVideo = JSON.stringify(studentVideos.json).includes(videoTitle);
  check('F2', 'Student sees the new video in the list', studentVideos.status === 200 && seesVideo);

  const reviewRes = await api('POST', `/tracks/${track._id}/reviews`, {
    token: stu.token,
    body: { itemId: created.videoId, itemType: 'video' },
  });
  check(
    'F2',
    'Student marks the video as reviewed',
    reviewRes.status === 200 && reviewRes.json?.data?.reviewed === true,
    `got ${reviewRes.status}`
  );

  const myReviews = await api('GET', `/tracks/${track._id}/my-reviews`, { token: stu.token });
  check(
    'F2',
    'my-reviews includes the video',
    myReviews.status === 200 && JSON.stringify(myReviews.json).includes(String(created.videoId))
  );

  const board = await api('GET', `/tracks/${track._id}/leaderboard`, { token: stu.token });
  const myRow = (board.json?.data?.leaderboard || []).find(
    (row) => String(row.user?._id) === String(newStudent._id)
  );
  check(
    'F2',
    'Leaderboard shows the student with progress',
    board.status === 200 && !!myRow && myRow.reviewedCount >= 1,
    myRow ? `reviewedCount=${myRow.reviewedCount}, progress=${myRow.progressPercent}%` : `got ${board.status}`
  );

  // ==================================================================
  // FLOW 3 — Track chat
  // ==================================================================
  console.log('\n━━━ Flow 3: Track chat ━━━');
  const chatContent = `Smoke test message ${Date.now()}`;
  const sendRes = await api('POST', `/tracks/${track._id}/chat`, {
    token: stu.token,
    body: { content: chatContent },
  });
  created.chatMsgId = sendRes.json?.data?.message?._id;
  check('F3', 'Student sends a chat message (201)', sendRes.status === 201 && !!created.chatMsgId, `got ${sendRes.status}`);

  const memberRead = await api('GET', `/tracks/${track._id}/chat`, { token: inst.token });
  check(
    'F3',
    'Instructor (member) reads the message',
    memberRead.status === 200 && JSON.stringify(memberRead.json).includes(chatContent)
  );

  const outsider = await login(outsiderStudent.email);
  const outsiderRead = await api('GET', `/tracks/${track._id}/chat`, { token: outsider.token });
  check('F3', 'Non-member is rejected from chat (403)', outsiderRead.status === 403, `got ${outsiderRead.status}`);

  const delMsg = await api('DELETE', `/tracks/chat/${created.chatMsgId}`, { token: stu.token });
  check('F3', 'Poster deletes own message (204)', delMsg.status === 204, `got ${delMsg.status}`);

  // ==================================================================
  // FLOW 4 — Multipart file upload (Cloudinary-backed)
  // ==================================================================
  console.log('\n━━━ Flow 4: Instructor uploads a file (multipart) ━━━');
  const fd = new FormData();
  fd.append('file', new Blob(['ITI Hub smoke test file content'], { type: 'text/plain' }), 'smoke-test.txt');
  fd.append('isShared', 'false');
  const uploadRes = await api('POST', `/tracks/${track._id}/files`, { token: inst.token, formData: fd });
  created.fileId = uploadRes.json?.data?.file?._id;
  const uploadOk = uploadRes.status === 201 && !!created.fileId;
  check('F4', 'File upload succeeds (201)', uploadOk, uploadOk
    ? `fileUrl=${uploadRes.json.data.file.fileUrl}`
    : `got ${uploadRes.status}: ${uploadRes.json?.message || uploadRes.text.slice(0, 160)}`);

  if (uploadOk) {
    const filesList = await api('GET', `/tracks/${track._id}/files`, { token: stu.token });
    check('F4', 'Student sees the uploaded file', JSON.stringify(filesList.json).includes('smoke-test.txt'));
    const delFile = await api('DELETE', `/tracks/files/${created.fileId}`, { token: inst.token });
    check('F4', 'Instructor deletes the file (204)', delFile.status === 204, `got ${delFile.status}`);
  } else {
    check('F4', 'Student sees the uploaded file', false, 'skipped (upload failed)');
  }

  // ==================================================================
  // FLOW 5 - Workspace extras: folders + records (Teams links)
  // ==================================================================
  console.log('\n--- Flow 5: Folders + records (workspace extras) ---');

  const studentFolder = await api('POST', `/tracks/${track._id}/folders`, {
    token: stu.token,
    body: { name: 'Should Not Exist' },
  });
  check('F5', 'Student cannot create folders (403)', studentFolder.status === 403, `got ${studentFolder.status}`);

  const folderRes = await api('POST', `/tracks/${track._id}/folders`, {
    token: mgr.token,
    body: { name: `Smoke Folder ${Date.now()}` },
  });
  created.folderId = folderRes.json?.data?.folder?._id;
  check('F5', 'Manager creates a folder (201)', folderRes.status === 201 && !!created.folderId, `got ${folderRes.status}`);

  const foldersList = await api('GET', `/tracks/${track._id}/folders`, { token: stu.token });
  check(
    'F5',
    'Student sees the folder in the list',
    foldersList.status === 200 && JSON.stringify(foldersList.json).includes(String(created.folderId)),
    `got ${foldersList.status}`
  );

  const studentRecord = await api('POST', `/tracks/${track._id}/records`, {
    token: stu.token,
    body: { title: 'Should Not Exist', url: 'https://example.com/x' },
  });
  check('F5', 'Student cannot create records (403)', studentRecord.status === 403, `got ${studentRecord.status}`);

  const recordRes = await api('POST', `/tracks/${track._id}/records`, {
    token: inst.token,
    body: {
      title: `Smoke Record ${Date.now()}`,
      teamsUrl: 'https://teams.microsoft.com/l/meetup-join/19:meeting_smokeTest',
      description: 'Created by the automated smoke test',
    },
  });
  created.recordId = recordRes.json?.data?.record?._id;
  check('F5', 'Manager creates a Teams record (201)', recordRes.status === 201 && !!created.recordId, `got ${recordRes.status}`);

  const recordsList = await api('GET', `/tracks/${track._id}/records`, { token: stu.token });
  check(
    'F5',
    'Student sees the record (Teams link)',
    recordsList.status === 200 && JSON.stringify(recordsList.json).includes('teams.microsoft.com'),
    `got ${recordsList.status}`
  );

  const outsiderRecords = await api('GET', `/tracks/${track._id}/records`, { token: outsider.token });
  check('F5', 'Non-member is rejected from records (403)', outsiderRecords.status === 403, `got ${outsiderRecords.status}`);

  // ==================================================================
  // CLEANUP — leave the DB as we found it
  // ==================================================================
  console.log('\n━━━ Cleanup ━━━');
  if (created.videoId) {
    const delVideo = await api('DELETE', `/tracks/videos/${created.videoId}`, { token: inst.token });
    console.log(`   🧹 Deleted test video via API: HTTP ${delVideo.status}`);
  }
  await TrackItemReview.deleteMany({ userId: newStudent._id, itemId: created.videoId });
  await Enrollment.deleteOne({ user_id: newStudent._id, track_id: track._id });
  await Track.updateOne({ _id: track._id }, { $pull: { studentIds: newStudent._id } });
  await User.updateOne({ _id: newStudent._id }, { $pull: { trackIds: track._id } });
  await TrackChatMessage.deleteMany({ trackId: track._id, message: chatContent });
  await CourseFile.deleteMany({ _id: created.fileId });
  await CourseVideo.deleteMany({ _id: created.videoId });
  if (created.recordId) await TrackRecord.deleteMany({ _id: created.recordId });
  if (created.folderId) await TrackFolder.deleteMany({ _id: created.folderId });
  if (created.requestId) await EnrollmentRequest.deleteMany({ _id: created.requestId });
  if (created.outsiderRequestId) await EnrollmentRequest.deleteMany({ _id: created.outsiderRequestId });
  if (created.outsiderRequestId2) await EnrollmentRequest.deleteMany({ _id: created.outsiderRequestId2 });
  await Notification.deleteMany({ target: track._id, type: { $in: ['enrollment_request', 'enrollment_approved', 'enrollment_rejected'] } });
  console.log('   🧹 Removed test enrollment, review, chat message, video/file docs');

  // ==================================================================
  // SUMMARY
  // ==================================================================
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('\n══════════════════════════════════════');
  console.log(`📊 SMOKE TEST SUMMARY: ${passed}/${results.length} passed, ${failed} failed`);
  for (const flow of ['F0', 'F1', 'F2', 'F3', 'F4', 'F5']) {
    const fr = results.filter((r) => r.flow === flow);
    const fp = fr.filter((r) => r.pass).length;
    console.log(`   ${flow}: ${fp}/${fr.length} ${fp === fr.length ? '✅' : '⚠️'}`);
  }
  console.log('══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\n💥 Smoke test crashed:', err.message);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(2);
});

