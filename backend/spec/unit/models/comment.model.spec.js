const path = require('path');
const mongoHelper = require("../../setup/mongo");
const mongoose = require('mongoose');
const Comment = require('../../../models/Comment');

describe('Comment model', () => {
  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('saves a comment with required fields and defaults', async () => {
    const payload = {
      post_id: new mongoose.Types.ObjectId(),
      author_id: new mongoose.Types.ObjectId(),
      content: 'This is a comment',
    };

    const comment = new Comment(payload);
    await comment.save();

    const fromDb = await Comment.findOne({ _id: comment._id }).lean();
    expect(fromDb).toBeDefined();
    expect(fromDb.content).toBe(payload.content);
    expect(fromDb.post_id).toBeDefined();
    expect(fromDb.author_id).toBeDefined();
    // defaults
    expect(fromDb.parent_comment_id).toBeNull();
    expect(fromDb.image_url).toBeNull();
    expect(fromDb.created_at).toBeDefined();
    expect(new Date(fromDb.created_at).getTime()).not.toBeNaN();
  });

  it('allows nesting via parent_comment_id', async () => {
    const parent = new Comment({
      post_id: new mongoose.Types.ObjectId(),
      author_id: new mongoose.Types.ObjectId(),
      content: 'parent',
    });
    await parent.save();

    const child = new Comment({
      post_id: parent.post_id,
      author_id: parent.author_id,
      content: 'child',
      parent_comment_id: parent._id,
    });
    await child.save();

    const fromDb = await Comment.findOne({ _id: child._id }).lean();
    expect(String(fromDb.parent_comment_id)).toBe(String(parent._id));
  });

  it('throws validation error when required fields are missing', async () => {
    const missingAll = new Comment({});
    let err;
    try {
      await missingAll.save();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });
});
