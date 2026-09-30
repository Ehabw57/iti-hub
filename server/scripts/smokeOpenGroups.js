/** Live HTTP smoke test, following smokeTest.js conventions.
 * Usage: node scripts/smokeOpenGroups.js http://localhost:5055
 * Uses seeded accounts; cleans up only the groups it creates and their requests/notifications.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Group = require('../models/CommunityGroup');
const JoinRequest = require('../models/GroupJoinRequest');
const Notification = require('../models/Notification');
const BASE = process.argv[2] || 'http://localhost:5000';
const createdIds = [];
const results = [];
async function api(method, path, token, body) {
  const response = await fetch(`${BASE}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}
function check(label, condition) {
  results.push({ label, pass: Boolean(condition) });
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`);
  if (!condition) throw new Error(label);
}
(async () => {
  await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');
  const accounts = ['student5@itihub.com', 'instructor1@itihub.com', 'admin.alexandria@itihub.com', 'superadmin@itihub.com'];
  const sessions = [];
  for (const email of accounts) {
    const login = await api('POST', '/auth/login', null, { email, password: process.env.SMOKE_PASSWORD || 'User123!' });
    check(`Seeded ${email.split('@')[0]} login`, login.status === 200);
    sessions.push(login.body.data);
  }
  check('Guest creation denied', (await api('POST', '/community/groups', null, { name: 'Guest', specialization: 'Web' })).status === 401);
  for (const session of sessions) {
    const created = await api('POST', '/community/groups', session.token, { name: `Smoke ${session.user.role} ${Date.now()}`, specialization: 'Web Development' });
    if (created.body.data?.group?._id) createdIds.push(created.body.data.group._id);
    check(`${session.user.role} owns newly created group`, created.status === 201 && created.body.data.group.createdBy === session.user._id);
  }
  // Refuse cleanup against an unrelated database even if a different server URL was supplied.
  check('Fixture database matches target server', await Group.countDocuments({ _id: { $in: createdIds } }) === createdIds.length);
  const [owner, requester, outsider] = sessions;
  const groupId = createdIds[0];
  const joined = await api('POST', `/community/groups/${groupId}/join`, requester.token);
  check('Join request is pending', joined.status === 201 && joined.body.data.request.status === 'pending');
  const requestId = joined.body.data.request._id;
  const decisionPath = `/community/groups/join-requests/${requestId}/decision`;
  check('Unrelated branch admin cannot approve', (await api('PATCH', decisionPath, outsider.token, { decision: 'approved' })).status === 403);
  check('Student owner approves', (await api('PATCH', decisionPath, owner.token, { decision: 'approved' })).status === 200);
  const detail = await api('GET', `/community/groups/${groupId}`, requester.token);
  check('Approved requester sees membership', detail.body.data?.group?.isJoined === true && detail.body.data.group.memberCount === 2);
  check('Second decision is rejected', (await api('PATCH', decisionPath, owner.token, { decision: 'rejected' })).status === 409);
})().catch(error => { console.error('Smoke failed:', error.message); process.exitCode = 1; }).finally(async () => {
  if (createdIds.length && mongoose.connection.readyState === 1) {
    await JoinRequest.deleteMany({ group_id: { $in: createdIds } });
    await Notification.deleteMany({ targetModel: 'CommunityGroup', target: { $in: createdIds } });
    await Group.deleteMany({ _id: { $in: createdIds } });
  }
  await mongoose.disconnect();
  console.log(`${results.filter(result => result.pass).length}/${results.length} smoke checks passed`);
});
