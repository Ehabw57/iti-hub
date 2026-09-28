const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Branch = require('../../models/Branch');
const Track = require('../../models/Track');
const Group = require('../../models/CommunityGroup');
const Enrollment = require('../../models/Enrollment');
const EnrollmentRequest = require('../../models/EnrollmentRequest');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');
const { errorHandler } = require('../../middlewares/errorHandler');

describe('Work-order API journeys', () => {
  let app, student, owner, instructor, branchAdmin, outsideAdmin, superAdmin, branch, otherBranch, track;
  const token = user => jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  const api = (method, url, user, body) => {
    const call = request(app)[method](url);
    if (user) call.set('Authorization', `Bearer ${token(user)}`);
    return body ? call.send(body) : call;
  };
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'work-order-test-secret';
    await connectToDB();
    app = express(); app.use(express.json());
    app.use('/community', require('../../routes/communityGroupRoutes'));
    app.use('/tracks', require('../../routes/trackRoutes'));
    app.use(errorHandler);
  });
  afterAll(disconnectFromDB);
  beforeEach(async () => {
    await clearDatabase();
    branch = await Branch.create({ name: 'Audit branch' });
    otherBranch = await Branch.create({ name: 'Other branch' });
    const makeUser = (name, role, branchId = branch._id) => User.create({
      email: `${name}@example.com`, username: name, fullName: `Test ${name}`,
      password: 'TestPassword123!', role, branchId,
    });
    [student, owner, instructor, branchAdmin, outsideAdmin, superAdmin] = await Promise.all([
      makeUser('student', 'student'), makeUser('owner', 'student'), makeUser('instructor', 'instructor'),
      makeUser('branchadmin', 'branch_admin'), makeUser('outsideadmin', 'branch_admin', otherBranch._id),
      makeUser('superadmin', 'super_admin'),
    ]);
    track = await Track.create({ name: 'Test track', branchId: branch._id, instructorIds: [instructor._id] });
  });
  it('requires authentication and preserves creation validation', async () => {
    expect((await api('post', '/community/groups', null, { name: 'Test', specialization: 'Web' })).status).toBe(401);
    expect((await api('post', '/community/groups', student, { name: ' ', specialization: 'Web' })).status).toBe(400);
    expect((await api('post', '/community/groups', student, { name: 'Test' })).status).toBe(400);
  });
  it('allows each role to create and become owner/member', async () => {
    for (const user of [student, instructor, branchAdmin, superAdmin]) {
      const res = await api('post', '/community/groups', user, { name: `Group ${user.role}`, specialization: 'Web' });
      expect(res.status).toBe(201);
      expect(res.body.data.group.createdBy).toBe(String(user._id));
      expect(res.body.data.group.memberIds).toContain(String(user._id));
    }
  });
  it('runs create → request → owner approval → membership, denying outsiders and repeat decisions', async () => {
    const created = await api('post', '/community/groups', owner, { name: 'Owned', specialization: 'Web' });
    const groupId = created.body.data.group._id;
    const joined = await api('post', `/community/groups/${groupId}/join`, student);
    expect(joined.status).toBe(201);
    const requestId = joined.body.data.request._id;
    expect((await api('post', `/community/groups/${groupId}/join`, student)).status).toBe(409);
    expect((await api('get', `/community/groups/${groupId}/join-requests`, instructor)).status).toBe(403);
    expect((await api('patch', `/community/groups/join-requests/${requestId}/decision`, instructor, { decision: 'approved' })).status).toBe(403);
    expect((await api('get', `/community/groups/${groupId}/join-requests`, owner)).body.data.requests.length).toBe(1);
    expect((await api('patch', `/community/groups/join-requests/${requestId}/decision`, owner, { decision: 'approved' })).status).toBe(200);
    expect((await Group.findById(groupId)).memberIds.map(String)).toContain(String(student._id));
    expect((await api('patch', `/community/groups/join-requests/${requestId}/decision`, owner, { decision: 'rejected' })).status).toBe(409);
  });
  it('rejects a group request without membership and permits a new request', async () => {
    const group = await Group.create({ name: 'Reject', specialization: 'Web', createdBy: owner._id, memberIds: [owner._id] });
    const joined = await api('post', `/community/groups/${group._id}/join`, student);
    const endpoint = `/community/groups/join-requests/${joined.body.data.request._id}`;
    expect((await api('delete', endpoint, instructor)).status).toBe(403);
    expect((await api('patch', `${endpoint}/decision`, superAdmin, { decision: 'rejected' })).status).toBe(200);
    expect((await Group.findById(group._id)).memberIds.map(String)).not.toContain(String(student._id));
    const retry = await api('post', `/community/groups/${group._id}/join`, student);
    expect(retry.status).toBe(201);
    expect((await api('delete', `/community/groups/join-requests/${retry.body.data.request._id}`, student)).status).toBe(200);
  });
  it('validates enrollment branch and denies an outside manager', async () => {
    expect((await api('post', '/tracks/enroll-requests', student, { trackId: track._id })).status).toBe(400);
    expect((await api('post', '/tracks/enroll-requests', student, { trackId: track._id, branchId: otherBranch._id })).status).toBe(400);
    const res = await api('post', '/tracks/enroll-requests', student, { trackId: track._id, branchId: branch._id });
    expect(res.status).toBe(201);
    expect((await api('patch', `/tracks/enroll-requests/${res.body.data.request._id}/decision`, outsideAdmin, { decision: 'approved' })).status).toBe(403);
    expect((await EnrollmentRequest.findById(res.body.data.request._id)).status).toBe('pending');
  });
  it('approves enrollment and synchronizes all three membership records', async () => {
    const body = { trackId: track._id, branchId: branch._id };
    const res = await api('post', '/tracks/enroll-requests', student, body);
    expect((await api('post', '/tracks/enroll-requests', student, body)).status).toBe(409);
    const endpoint = `/tracks/enroll-requests/${res.body.data.request._id}/decision`;
    expect((await api('patch', endpoint, instructor, { decision: 'approved' })).status).toBe(200);
    expect(await Enrollment.countDocuments({ user_id: student._id, track_id: track._id })).toBe(1);
    expect((await Track.findById(track._id)).studentIds.map(String)).toContain(String(student._id));
    expect((await User.findById(student._id)).trackIds.map(String)).toContain(String(track._id));
    expect((await api('get', `/tracks/${track._id}/records`, student)).status).toBe(200);
    expect((await api('patch', endpoint, branchAdmin, { decision: 'approved' })).status).toBe(409);
  });
  it('keeps rejected and cancelled enrollments out of membership', async () => {
    const body = { trackId: track._id, branchId: branch._id };
    const res = await api('post', '/tracks/enroll-requests', student, body);
    expect((await api('patch', `/tracks/enroll-requests/${res.body.data.request._id}/decision`, branchAdmin, { decision: 'rejected' })).status).toBe(200);
    expect(await Enrollment.countDocuments({ user_id: student._id })).toBe(0);
    const retry = await api('post', '/tracks/enroll-requests', student, body);
    expect((await api('delete', `/tracks/enroll-requests/${retry.body.data.request._id}`, student)).status).toBe(200);
  });
  it('scopes folder and record CRUD to assigned uploaders and members', async () => {
    const base = `/tracks/${track._id}`;
    expect((await api('get', `${base}/records`, student)).status).toBe(403);
    expect((await api('post', `${base}/folders`, student, { name: 'No' })).status).toBe(403);
    const folder = await api('post', `${base}/folders`, instructor, { name: 'Sessions', kind: 'records' });
    expect(folder.status).toBe(201);
    const folderId = folder.body.data.folder._id;
    expect((await api('patch', `/tracks/folders/${folderId}`, outsideAdmin, { name: 'Denied' })).status).toBe(403);
    expect((await api('patch', `/tracks/folders/${folderId}`, instructor, { name: 'Week one' })).status).toBe(200);
    const record = await api('post', `${base}/records`, instructor, { title: 'Session', teamsUrl: 'https://example.com/session', folderId });
    expect(record.status).toBe(201);
    const recordId = record.body.data.record._id;
    expect((await api('patch', `/tracks/records/${recordId}`, outsideAdmin, { title: 'Denied' })).status).toBe(403);
    expect((await api('patch', `/tracks/records/${recordId}`, instructor, { title: 'Updated' })).status).toBe(200);
    expect((await api('delete', `/tracks/records/${recordId}`, instructor)).status).toBe(204);
    expect((await api('delete', `/tracks/folders/${folderId}`, instructor)).status).toBe(204);
  });
  it('rejects records assigned to a file folder or another track folder', async () => {
    const folder = await api('post', `/tracks/${track._id}/folders`, instructor, { name: 'Files', kind: 'files' });
    expect((await api('post', `/tracks/${track._id}/records`, instructor, { title: 'Bad', teamsUrl: 'https://example.com', folderId: folder.body.data.folder._id })).status).toBe(400);
    const other = await Track.create({ name: 'Other track', branchId: otherBranch._id });
    const otherFolder = await api('post', `/tracks/${other._id}/folders`, superAdmin, { name: 'Foreign', kind: 'records' });
    expect((await api('post', `/tracks/${track._id}/records`, instructor, { title: 'Bad', teamsUrl: 'https://example.com', folderId: otherFolder.body.data.folder._id })).status).toBe(400);
  });
  it('uploads, lists and deletes a file with uploader/member scoping', async () => {
    const savedCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    let localFile;
    try {
      const base = `/tracks/${track._id}/files`;
      const uploaded = await request(app).post(base).set('Authorization', `Bearer ${token(instructor)}`)
        .attach('file', Buffer.from('work-order upload fixture'), 'audit.txt');
      expect(uploaded.status).toBe(201);
      const file = uploaded.body.data.file;
      const path = require('path');
      const root = path.resolve(__dirname, '../../uploads');
      localFile = path.resolve(root, new URL(file.fileUrl).pathname.replace(/^\/uploads\//, ''));
      if (!localFile.startsWith(root + path.sep)) throw new Error('Unexpected fixture path');
      expect((await api('get', base, instructor)).body.data.files.some(item => item._id === file._id)).toBeTrue();
      expect((await api('get', base, student)).status).toBe(403);
      expect((await api('delete', `/tracks/files/${file._id}`, outsideAdmin)).status).toBe(403);
      expect((await api('delete', `/tracks/files/${file._id}`, instructor)).status).toBe(204);
      expect((await api('get', base, instructor)).body.data.files.length).toBe(0);
    } finally {
      if (savedCloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
      else process.env.CLOUDINARY_CLOUD_NAME = savedCloudName;
      // Current storage deletion does not handle absolute local URLs (audit gap).
      if (localFile) await require('fs/promises').unlink(localFile).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  });
});
