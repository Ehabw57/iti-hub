const express = require('express');
const request = require('supertest');

const mongoHelper = require('../setup/mongo');
const User = require('../../models/User');
const Post = require('../../models/Post');
const userRoute = require('../../routes/userRoutes');

describe('User routes integration', () => {
  let app;

  beforeAll(async () => {
    await mongoHelper.connectToDB();

    app = express();
    app.use(express.json());

    app.use(userRoute);
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('POST /user - create a user', async () => {
    const payload = { first_name: 'U', last_name: 'Ser', email: 'u1@example.com', password: 'pwd' };
    const res = await request(app).post('/user').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(payload.email);
  });

  it('GET /user - returns list of users', async () => {
    await new User({ first_name: 'A', last_name: 'B', email: 'a@x.com', password: 'password' }).save();
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTrue();
    expect(res.body.length).toBe(1);
  });

  it('GET /users/:id - returns a user or 404', async () => {
    const u = await new User({ first_name: 'Find', last_name: 'Me', email: 'find@example.com', password: 'pwd' }).save();
    const r1 = await request(app).get(`/users/${u._id}`);
    expect(r1.status).toBe(200);
    expect(r1.body.email).toBe(u.email);

    const fake = '000000000000000000000000';
    const r2 = await request(app).get(`/users/${fake}`);
    expect(r2.status).toBe(404);
  });

  it('PUT /users/:id - update and DELETE /users/:id - delete', async () => {
    const u = await new User({ first_name: 'Up', last_name: 'Date', email: 'up@example.com', password: 'pwd' }).save();
    const r1 = await request(app).put(`/users/${u._id}`).send({ first_name: 'Updated' });
    expect(r1.status).toBe(200);
    expect(r1.body.first_name).toBe('Updated');

    const r2 = await request(app).delete(`/users/${u._id}`);
    expect(r2.status).toBe(200);
    expect(r2.body.message).toMatch(/deleted successfully/i);
  });

  it('GET /users/:id/posts - returns posts authored by the user', async () => {
    const u = await new User({ first_name: 'Post', last_name: 'Author', email: 'postauthor@example.com', password: 'pwd' }).save();
    await Post.create({ author_id: u._id, content: 'p1' });
    await Post.create({ author_id: u._id, content: 'p2' });

    const res = await request(app).get(`/users/${u._id}/posts`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBeTrue();
    expect(res.body.data.length).toBe(2);
  });
});
