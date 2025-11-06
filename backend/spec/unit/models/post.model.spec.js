const path = require('path');
const mongoHelper = require("../../setup/mongo");
const mongoose = require('mongoose');
const Post = require('../../../models/Post');

describe('Post model', () => {
  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('saves a post with required fields and media', async () => {
    const payload = {
      author_id: new mongoose.Types.ObjectId(),
      content: 'Hello world',
      media: [{ url: 'http://example.com/image.jpg', type: 'photo' }],
    };

    const post = new Post(payload);
    await post.save();

    const fromDb = await Post.findOne({ _id: post._id }).lean();
    expect(fromDb).toBeDefined();
    expect(fromDb.content).toBe(payload.content);
    expect(Array.isArray(fromDb.media)).toBeTrue();
    expect(fromDb.media.length).toBe(1);
    expect(fromDb.media[0].url).toBe(payload.media[0].url);
    expect(fromDb.media[0].type).toBe('photo');
    expect(fromDb.author_id).toBeDefined();
  });

  it('defaults media.type to "file" when not provided', async () => {
    const payload = {
      author_id: new mongoose.Types.ObjectId(),
      content: 'Post with default media type',
      media: [{ url: 'http://example.com/file.bin' }],
    };

    const post = new Post(payload);
    await post.save();

    const fromDb = await Post.findOne({ _id: post._id }).lean();
    expect(fromDb.media[0].type).toBe('file');
  });

  it('throws validation error when required fields are missing', async () => {
    // missing content
    const missingContent = new Post({ author_id: new mongoose.Types.ObjectId() });
    let err;
    try {
      await missingContent.save();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');

    // missing author_id
    const missingAuthor = new Post({ content: 'No author' });
    err = undefined;
    try {
      await missingAuthor.save();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });
});
