/**
 * Work-order E2E smoke test — verifies all wired flows against the live
 * server (http://localhost:5000) using seeded role accounts.
 * Run: node scripts/smokeWorkOrder.js
 */
const BASE = 'http://localhost:5000';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const login = async (email) =>
  (await api('POST', '/auth/login', { body: { email, password: 'User123!' } })).data.token;

function check(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${label}${extra ? ` (${extra})` : ''}`);
  if (!cond) process.exitCode = 1;
}

(async () => {
  const sup = await login('superadmin@itihub.com');
  const inst = await login('instructor1@itihub.com');
  const stu = await login('student5@itihub.com');

  // ---- §5b: search tests (partial / casing / no-match / legacy role) ----
  const t1 = await api('GET', '/tracks/users/search?role=student&q=studen', { token: sup });
  check('§5b partial "studen" finds seeded students', t1.data.users.length >= 10, `${t1.data.users.length} users`);
  const t2 = await api('GET', `/tracks/users/search?role=student&q=${encodeURIComponent('STUDENT 7')}`, { token: sup });
  check('§5b case-insensitive "STUDENT 7"', t2.data.users.some((u) => u.fullName === 'Student 7'));
  const t3 = await api('GET', '/tracks/users/search?role=student&q=zzzqqq', { token: sup });
  check('§5b no-match returns empty (not error)', Array.isArray(t3.data.users) && t3.data.users.length === 0);
  const t4 = await api('GET', '/tracks/users/search?role=student&q=', { token: sup });
  check('§5b legacy "user" role included as student', t4.data.users.some((u) => u.role === 'user'));

  // ---- §5c: instructor access to search ----
  const instSearch = await api('GET', '/tracks/users/search?role=student&q=student', { token: inst });
  check('§5c instructor can call user search (was 403)', Array.isArray(instSearch.data.users));

  const me = await api('GET', '/users/me', { token: inst });
  const allTracks = await api('GET', '/tracks?limit=100', { token: sup });
  const myTrack = allTracks.data.tracks.find(
    (t) => (t.instructorIds || []).some((i) => i && String(i._id || i) === String(me._id))
  );
  check('instructor1 track located', !!myTrack, myTrack?.name);

  // ---- §5c: instructor direct-add ----
  const before = await api('GET', `/tracks/${myTrack._id}/members`, { token: inst });
  const existingIds = new Set([
    ...before.data.instructors.map((u) => String(u._id)),
    ...before.data.students.map((u) => String(u._id)),
  ]);
  const pool = await api('GET', '/tracks/users/search?role=student&q=', { token: inst });
  const candidate = pool.data.users.find((u) => !existingIds.has(String(u._id)));
  if (candidate) {
    const patched = await api('PATCH', `/tracks/${myTrack._id}/members`, {
      token: inst,
      body: { addStudents: [candidate._id] },
    });
    check('§5c instructor can directly add a student (was 403)', patched.data.track.studentCount === before.data.students.length + 1);
  } else {
    check('§5c instructor direct-add: candidate available', true, 'all branch students already members — skipped');
  }

  // ---- fresh requester: first seeded student not yet a member of myTrack ----
  // (derived from the members list — no extra logins that would trip the
  // auth rate limiter)
  const membersNow = await api('GET', `/tracks/${myTrack._id}/members`, { token: inst });
  const memberUsernames = new Set([
    ...membersNow.data.instructors.map((u) => u.username),
    ...membersNow.data.students.map((u) => u.username),
  ]);
  // Candidate pool: the 12 seeded "student" accounts first, then the 40
  // broader "user0XX" seed accounts (both use the same seeded password).
  // Emails follow the seed convention: username === local part of the email.
  const candidateUsernames = [];
  for (let n = 1; n <= 12; n++) candidateUsernames.push(`student${n}`);
  for (let n = 1; n <= 40; n++) candidateUsernames.push(`user${String(n).padStart(3, '0')}`);
  // student5 is already logged in as `stu` above — reuse its token if eligible
  let stu2 = null;
  for (const username of candidateUsernames) {
    if (memberUsernames.has(username)) continue;
    if (username === 'student5') { stu2 = { token: stu, n: 'student5' }; break; }
    const email = username.startsWith('user')
      ? `${username}@test.com`   // user001..user040 seed accounts
      : `${username}@itihub.com`; // student1..student12 seed accounts
    try {
      stu2 = { token: await login(email), n: username };
      break;
    } catch (e) {
      if (String(e.message).includes('429')) {
        // Auth rate limiter hit (10 logins / 15 min per IP) — stop immediately
        // instead of burning more of the budget on further attempts.
        throw e;
      }
      // 401 etc. — account missing in this environment; try next candidate
    }
  }
  check('fresh student requester found', !!stu2, stu2 ? String(stu2.n) : 'none');

  // ---- §5a: instructor approves a pending request end-to-end ----
  const branchId = myTrack.branchId;
  // If an interrupted prior run left a pending request for this candidate,
  // reuse it instead of POSTing again (which would 409 "already pending").
  const pendingList = await api('GET', '/tracks/enroll-requests?status=pending', { token: inst });
  const leftover = (pendingList.data.requests || []).find(
    (r) => r.user_id?.username === String(stu2.n) && String(r.track_id?._id) === String(myTrack._id)
  );
  let req;
  if (leftover) {
    req = { data: { request: { _id: leftover._id, status: leftover.status } } };
  } else {
    req = await api('POST', '/tracks/enroll-requests', {
      token: stu2.token,
      body: { trackId: myTrack._id, branchId },
    });
  }
  const decided = await api('PATCH', `/tracks/enroll-requests/${req.data.request._id}/decision`, {
    token: inst,
    body: { decision: 'approved' },
  });
  check('§5a instructor approve works end-to-end', decided.data.request.status === 'approved');
  const enrolled = await api('GET', `/tracks/check-enrollment?trackId=${myTrack._id}`, { token: stu2.token });
  check('§5a approved student gains access', enrolled.data.isEnrolled === true);

  // ---- §1: events (create → student sees → register toggle) ----
  const ev = await api('POST', '/events', {
    token: sup,
    body: {
      title: 'E2E Hackathon 2026',
      description: 'Work order verification',
      date: new Date(Date.now() + 10 * 864e5).toISOString(),
      location: 'Smart Village',
      branchIds: [branchId],
      registerUrl: 'https://iti.example.com',
    },
  });
  const evList = await api('GET', '/events', { token: stu });
  const seenEv = evList.data.events.find((e) => e._id === ev.data.event._id);
  check('§1 event created & visible to student', !!seenEv);
  check('§1 branch names populated', (seenEv.branchIds || []).some((b) => b && b.name));
  const reg1 = await api('POST', `/events/${ev.data.event._id}/register`, { token: stu });
  check('§1 register toggle on', reg1.data.isRegistered === true);
  const reg2 = await api('POST', `/events/${ev.data.event._id}/register`, { token: stu });
  check('§1 unregister toggle off', reg2.data.isRegistered === false);

  // ---- §4: jobs ----
  const job = await api('POST', '/jobs', {
    token: sup,
    body: {
      title: 'Junior .NET Developer',
      company: 'E2E Corp',
      location: 'Cairo',
      description: 'verify',
      tags: ['Full Stack .NET'],
      applyUrl: 'https://careers.example.com/1',
    },
  });
  const jobs = await api('GET', '/jobs', { token: stu });
  check('§4 job created & appears in student list', jobs.data.jobs.some((j) => j._id === job.data.job._id));

  // ---- §2: folders (instructor creates, student views) ----
  const folder = await api('POST', `/tracks/${myTrack._id}/folders`, {
    token: inst,
    body: { name: `E2E Folder ${Date.now()}` },
  });
  check('§2 folder created by instructor', !!folder.data.folder._id);
  const foldersList = await api('GET', `/tracks/${myTrack._id}/folders`, { token: stu });
  check('§2 folders list visible to student', foldersList.data.folders.some((f) => f._id === folder.data.folder._id));

  // ---- §3: videos (instructor adds, student views) ----
  const video = await api('POST', `/tracks/${myTrack._id}/videos`, {
    token: inst,
    body: {
      title: 'E2E Intro Lecture',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: null,
      durationSeconds: 300,
    },
  });
  check('§3 video added by instructor', !!video.data.video._id);
  const videosList = await api('GET', `/tracks/${myTrack._id}/videos`, { token: stu });
  check('§3 videos visible to student', videosList.data.videos.some((v) => v._id === video.data.video._id));

  // ---- §6: trending topics ----
  const topics = await api('GET', '/feed/trending-topics?limit=5');
  check('§6 trending topics endpoint returns array', Array.isArray(topics.data.topics), `source=${topics.data.source}, n=${topics.data.topics.length}`);

  // ==================================================================
  // §7: Messages — group admin controls (type-virtual prerequisite fix)
  // ==================================================================
  const poolUsers = await api('GET', '/search/users?q=student&limit=10', { token: sup });
  const candidates = (poolUsers.data?.users || []).slice(0, 2);
  if (candidates.length === 2) {
    const grp = await api('POST', '/conversations/group', {
      token: sup,
      // The controller JSON.parses this field — send the ids as a JSON string,
      // exactly like the client does via FormData.
      body: { name: `E2E Admin Group ${Date.now()}`, participantIds: JSON.stringify(candidates.map((u) => u._id)) },
    });
    check('§7 group conversation created', !!grp.data.conversation?._id);

    const convId = grp.data.conversation._id;
    // NOTE: getConversation returns the conversation directly as data
    const fetched = await api('GET', `/conversations/${convId}`, { token: sup });
    const conv = fetched.data;
    check('§7 group conversation fetch includes admin field', !!conv?.admin?._id);
    check('§7 formatted type is "group" (virtual)', conv?.type === 'group');

    // Rename group (was dead code before the type fix)
    const renamed = await api('PATCH', `/conversations/${convId}`, {
      token: sup,
      body: { name: `Renamed Group ${Date.now()}` },
    });
    check('§7 admin rename group works (was 400 "Can only update group conversations")', renamed.data.conversation?.name?.startsWith('Renamed Group'));

    // Add + remove member (was dead code before the type fix). Pick an extra
    // user from the student pool (instructor search pool can be exhausted).
    const extra = candidates[2] || (poolUsers.data?.users || []).find(
      (u) => !candidates.some((c) => c._id === u._id) && u._id !== me._id
    );
    if (extra) {
      const added = await api('POST', `/conversations/${convId}/members`, {
        token: sup,
        body: { userId: extra._id },
      });
      check('§7 admin add member works', (added.data.conversation?.participants || []).some((p) => p._id === extra._id));
      const removed = await api('DELETE', `/conversations/${convId}/members/${extra._id}`, { token: sup });
      check('§7 admin remove member works', !(removed.data.conversation?.participants || []).some((p) => p._id === extra._id));
    } else {
      check('§7 add/remove member: extra user available', true, 'skipped — pool exhausted');
    }

    // Delete group (new endpoint)
    const del = await fetch(`${BASE}/conversations/${convId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sup}` },
    });
    check('§7 admin delete group returns 204', del.status === 204);
    const afterDel = await fetch(`${BASE}/conversations/${convId}`, {
      headers: { Authorization: `Bearer ${sup}` },
    });
    check('§7 deleted group is gone (404)', afterDel.status === 404);

    // Non-admin cannot delete a group
    const grp2 = await api('POST', '/conversations/group', {
      token: sup,
      body: { name: `E2E Guard Group ${Date.now()}`, participantIds: JSON.stringify(candidates.map((u) => u._id)) },
    });
    const forbidden = await fetch(`${BASE}/conversations/${grp2.data.conversation._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${stu}` },
    });
    check('§7 non-admin delete group is forbidden (403)', forbidden.status === 403);
    await api('DELETE', `/conversations/${grp2.data.conversation._id}`, { token: sup });
  } else {
    check('§7 group admin controls: two participants available', false, `got ${candidates.length}`);
  }

  // ==================================================================
  // §8: Community groups — join-request moderation flow
  // ==================================================================
  const communityGroups = await api('GET', '/community/groups', { token: stu });
  const targetGroup = (communityGroups.data.groups || []).find(
    (g) => !g.isJoined && !g.isPending && g.createdBy
  );
  check('§8 joinable group with admin found', !!targetGroup, targetGroup?.name);
  if (targetGroup) {
    // Student requests to join (no longer instant membership)
    const joinRes = await api('POST', `/community/groups/${targetGroup._id}/join`, { token: stu });
    check('§8 join request created as pending', joinRes.data.request?.status === 'pending');

    // Duplicate pending request is rejected
    const dup = await fetch(`${BASE}/community/groups/${targetGroup._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stu}` },
    });
    check('§8 duplicate pending request conflicts (409)', dup.status === 409);

    // Group list now shows isPending for the requester
    const myList = await api('GET', '/community/groups', { token: stu });
    const pendingFlagged = (myList.data.groups || []).find((g) => g._id === targetGroup._id);
    check('§8 isPending flag exposed in group list', pendingFlagged?.isPending === true);

    // Non-admin cannot list the review queue
    const notAdmin = await fetch(`${BASE}/community/groups/${targetGroup._id}/join-requests`, {
      headers: { Authorization: `Bearer ${stu}` },
    });
    check('§8 non-admin cannot view join-request queue (403)', notAdmin.status === 403);

    // Student cancels their own request
    const myReqs = await api('GET', '/community/groups/my-join-requests', { token: stu });
    const myReq = (myReqs.data.requests || []).find((r) => r.group?._id === targetGroup._id);
    check('§8 my-join-requests lists own pending request', !!myReq);
    if (myReq) {
      await api('DELETE', `/community/groups/join-requests/${myReq._id}`, { token: stu });
      const afterCancel = await api('GET', '/community/groups/my-join-requests', { token: stu });
      check(
        '§8 cancel own join request works',
        !(afterCancel.data.requests || []).some((r) => r._id === myReq._id)
      );
    }

    // Full request → approve flow with the group's admin
    const reJoin = await api('POST', `/community/groups/${targetGroup._id}/join`, { token: stu });
    const reReqId = reJoin.data.request?._id;
    // Reuse the super-admin token already held (super admin may review any
    // group's join requests) — avoids an extra login against the auth
    // rate limiter (10 logins / 15 min).
    const adminToken = sup;
    const queue = await api('GET', `/community/groups/${targetGroup._id}/join-requests?status=pending`, { token: adminToken });
    check('§8 admin sees pending request in queue', (queue.data.requests || []).some((r) => r._id === reReqId));
    const decidedJoin = await api('PATCH', `/community/groups/join-requests/${reReqId}/decision`, {
      token: adminToken,
      body: { decision: 'approved' },
    });
    check('§8 admin approve works end-to-end', decidedJoin.data.request?.status === 'approved');

    // Approving adds the requester to the group
    const afterApprove = await api('GET', '/community/groups', { token: stu });
    const joinedGroup = (afterApprove.data.groups || []).find((g) => g._id === targetGroup._id);
    check('§8 approved requester becomes member (isJoined)', joinedGroup?.isJoined === true);

    // Approved member leaves to restore state
    await api('POST', `/community/groups/${targetGroup._id}/leave`, { token: stu });
    const afterLeave = await api('GET', '/community/groups', { token: stu });
    const leftGroup = (afterLeave.data.groups || []).find((g) => g._id === targetGroup._id);
    check('§8 leave after approval restores state', leftGroup?.isJoined === false);
  }

  // ==================================================================
  // §9: Track file upload — local-disk fallback (no Cloudinary required)
  // ==================================================================
  const uploadFd = new FormData();
  uploadFd.append('file', new Blob(['ITI Hub smoke test file content'], { type: 'text/plain' }), 'smoke-test.txt');
  uploadFd.append('isShared', 'false');
  const uploadRes = await fetch(`${BASE}/tracks/${myTrack._id}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${inst}` },
    body: uploadFd,
  });
  const uploadJson = await uploadRes.json().catch(() => ({}));
  check(
    '§9 file upload works without Cloudinary (was 503 FILE_STORAGE_NOT_CONFIGURED)',
    uploadRes.status === 201 && !!uploadJson.data?.file?._id,
    `status=${uploadRes.status}`
  );
  if (uploadJson.data?.file?._id) {
    const fileUrl = uploadJson.data.file.fileUrl;
    check('§9 uploaded file URL is http(s)', /^https?:\/\//.test(fileUrl), fileUrl);
    const served = await fetch(fileUrl);
    check('§9 uploaded file is servable', served.status === 200, `status=${served.status}`);
    await api('DELETE', `/tracks/files/${uploadJson.data.file._id}`, { token: inst });
  }

  // ==================================================================
  // §10: Notifications — list + unread-count + mark-read flows (backs the
  // per-tab scrolling notifications UI; join-request notification fired)
  // ==================================================================
  const notifPage = await api('GET', '/notifications?page=1&limit=10', { token: sup });
  check('§10 notifications list returns paginated array', Array.isArray(notifPage.data.notifications));
  const unreadResp = await api('GET', '/notifications/unread/count', { token: sup });
  check('§10 unread count endpoint responds', typeof unreadResp.data.unreadCount === 'number');
  if ((notifPage.data.notifications || []).length > 0) {
    const anyNotif = notifPage.data.notifications.find((n) => !n.isRead) || notifPage.data.notifications[0];
    const marked = await api('PUT', `/notifications/${anyNotif._id}/read`, { token: sup });
    check('§10 mark single notification as read', marked.data.notification?.isRead === true);
  }
  const adminNotifs = await api('GET', '/notifications?page=1&limit=50', { token: sup });
  const sawJoinNotif = (adminNotifs.data.notifications || []).some((n) => n.type === 'group_join_request');
  check('§10 group_join_request notification delivered to admin', sawJoinNotif);

  // ---- cleanup: delete the e2e event & job (leave folder/video as demo content) ----
  await api('DELETE', `/events/${ev.data.event._id}`, { token: sup });
  await api('DELETE', `/jobs/${job.data.job._id}`, { token: sup });
  console.log('DONE');
})().catch((e) => {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
});
