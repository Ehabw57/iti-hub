const { Types } = require('mongoose');
const guards = require('../../middlewares/checkRoles');
const Track = require('../../models/Track');
const Branch = require('../../models/Branch');

describe('Hierarchy permissions and validation', () => {
  const id = () => new Types.ObjectId();
  let branch, otherBranch, instructor, student, track;
  beforeEach(() => {
    branch = id(); otherBranch = id();
    instructor = { _id: id(), role: 'instructor', branchId: branch };
    student = { _id: id(), role: 'student', branchId: branch };
    track = { branchId: branch, instructorIds: [instructor._id], studentIds: [student._id] };
  });
  it('denies unauthenticated access to branch, track and uploads', () => {
    expect(guards.canManageBranch(null, branch)).toBeFalse();
    expect(guards.canManageTrack(null, track)).toBeFalse();
    expect(guards.canUploadToTrack(null, track)).toBeFalse();
    expect(guards.isTrackMember(null, track)).toBeFalse();
  });
  it('scopes branch admins to their own branch', () => {
    const admin = { _id: id(), role: 'branch_admin', branchId: branch };
    expect(guards.canManageBranch(admin, branch)).toBeTrue();
    expect(guards.canManageBranch(admin, otherBranch)).toBeFalse();
    expect(guards.canManageTrack(admin, track)).toBeTrue();
    expect(guards.canManageTrack({ ...admin, branchId: otherBranch }, track)).toBeFalse();
    expect(guards.canManageBranch({ ...admin, branchId: null }, branch)).toBeFalse();
  });
  it('allows assigned instructors to upload but denies unrelated instructors', () => {
    expect(guards.canUploadToTrack(instructor, track)).toBeTrue();
    expect(guards.canUploadToTrack({ ...instructor, _id: id() }, track)).toBeFalse();
    expect(guards.canUploadToTrack(student, track)).toBeFalse();
    expect(guards.isTrackMember(student, track)).toBeTrue();
    expect(guards.isTrackMember({ ...student, _id: id() }, track)).toBeFalse();
  });
  for (const role of ['super_admin', 'admin']) {
    it(`lets ${role} override branch and membership scope`, () => {
      const user = { _id: id(), role };
      expect(guards.canManageBranch(user, otherBranch)).toBeTrue();
      expect(guards.canUploadToTrack(user, track)).toBeTrue();
      expect(guards.isTrackMember(user, track)).toBeTrue();
    });
  }
  it('rejects invalid track categories and branch types', () => {
    expect(new Track({ name: 'Invalid', category: 'made-up' }).validateSync().errors.category).toBeDefined();
    expect(new Branch({ name: 'Invalid', type: 'made-up' }).validateSync().errors.type).toBeDefined();
    expect(new Track({ name: 'Web', category: 'Web Development' }).validateSync()).toBeUndefined();
  });
  it('limits student chat deletion to their own messages', () => {
    expect(guards.canDeleteChatMessage(student, track, { senderId: student._id })).toBeTrue();
    expect(guards.canDeleteChatMessage(student, track, { senderId: instructor._id })).toBeFalse();
  });
});
