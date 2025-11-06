const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

const mongoHelper = require('../setup/mongo');
const User = require('../../models/User');
const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const postRoute = require('../../routes/postRoutes');

describe('Post routes integration', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoHelper.connectToDB();

    app = express();
    app.use(express.json());

    // simple auth mock: Authorization: Bearer <userId>
    app.use((req, res, next) => {
      const auth = req.header('Authorization');
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        req.user = { id: token };
      }
      next();
    });

    app.use(postRoute);
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('POST /posts - create a post (author set from token)', async () => {
    const user = await new User({ first_name: 'P', last_name: 'U', email: 'puser@example.com', password: 'password' }).save();

    const payload = { content: 'Hello world' };
    const res = await request(app).post('/posts').set('Authorization', `Bearer ${user._id}`).send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.author_id.toString()).toBe(user._id.toString());
    expect(res.body.data.content).toBe(payload.content);
  });

  it('GET /posts - list posts with pagination defaults', async () => {
    const u = await new User({ first_name: 'A', last_name: 'B', email: 'a@example.com', password: 'password' }).save();
    await Post.create({ author_id: u._id, content: 'one' });
    await Post.create({ author_id: u._id, content: 'two' });

    const res = await request(app).get('/posts');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBeTrue();
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('GET /posts/:id - returns a post or 404', async () => {
    const u = await new User({ first_name: 'G', last_name: 'H', email: 'g@example.com', password: 'password' }).save();
    const p = await Post.create({ author_id: u._id, content: 'findme' });

    const r1 = await request(app).get(`/posts/${p._id}`);
    expect(r1.status).toBe(200);
    expect(r1.body.data.content).toBe('findme');

    const fake = new mongoose.Types.ObjectId();
    const r2 = await request(app).get(`/posts/${fake}`);
    expect(r2.status).toBe(404);
  });

  it('PUT /posts/:id - only author can update', async () => {
    const author = await new User({ first_name: 'Auth', last_name: 'Or', email: 'auth@example.com', password: 'password' }).save();
    const other = await new User({ first_name: 'Other', last_name: 'One', email: 'other@example.com', password: 'password' }).save();
    const post = await Post.create({ author_id: author._id, content: 'original' });

    const resFail = await request(app).put(`/posts/${post._id}`).set('Authorization', `Bearer ${other._id}`).send({ content: 'updated' });
    expect(resFail.status).toBe(403);

    const resOk = await request(app).put(`/posts/${post._id}`).set('Authorization', `Bearer ${author._id}`).send({ content: 'updated' });
    expect(resOk.status).toBe(200);
    expect(resOk.body.data.content).toBe('updated');
  });

  it('DELETE /posts/:id - only author can delete', async () => {
    const author = await new User({ first_name: 'D', last_name: 'U', email: 'd@example.com', password: 'password' }).save();
    const other = await new User({ first_name: 'E', last_name: 'V', email: 'e@example.com', password: 'password' }).save();
    const post = await Post.create({ author_id: author._id, content: 'todelete' });

    const r1 = await request(app).delete(`/posts/${post._id}`).set('Authorization', `Bearer ${other._id}`);
    expect(r1.status).toBe(403);

    const r2 = await request(app).delete(`/posts/${post._id}`).set('Authorization', `Bearer ${author._id}`);
    expect(r2.status).toBe(200);
    const found = await Post.findById(post._id);
    expect(found).toBeNull();
  });

  it('POST /posts/:id/like - toggles like/unlike and updates likes_count', async () => {
    const author = await new User({ first_name: 'L', last_name: 'I', email: 'l@example.com', password: 'password' }).save();
    const liker = await new User({ first_name: 'K', last_name: 'R', email: 'k@example.com', password: 'password' }).save();
    const p = await Post.create({ author_id: author._id, content: 'like me' });

    const r1 = await request(app).post(`/posts/${p._id}/like`).set('Authorization', `Bearer ${liker._id}`);
    expect(r1.status).toBe(200);
    expect(r1.body.message).toMatch(/liked successfully/i);
    expect(r1.body.likes_count).toBe(1);

    const r2 = await request(app).post(`/posts/${p._id}/like`).set('Authorization', `Bearer ${liker._id}`);
    expect(r2.status).toBe(200);
    expect(r2.body.message).toMatch(/unliked successfully/i);
    expect(r2.body.likes_count).toBe(0);
  });

  it('GET /posts/:id/likes - returns likes array', async () => {
    const a = await new User({ first_name: 'M', last_name: 'N', email: 'm@example.com', password: 'password' }).save();
    const b = await new User({ first_name: 'O', last_name: 'P', email: 'o@example.com', password: 'password' }).save();
    const p = await Post.create({ author_id: a._id, content: 'liked' });
    await PostLike.create({ post_id: p._id, user_id: a._id });
    await PostLike.create({ post_id: p._id, user_id: b._id });

    const res = await request(app).get(`/posts/${p._id}/likes`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBeTrue();
    expect(res.body.data.length).toBe(2);
  });
});
