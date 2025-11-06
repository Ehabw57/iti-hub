const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mongoHelper = require('../setup/mongo');
const User = require('../../models/User');
const authRoute = require('../../routes/authRoutes');

describe('Auth routes integration', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoHelper.connectToDB();

    app = express();
    app.use(express.json());
    app.use(authRoute);
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('POST /register - should register a new user and not return password', async () => {
    const payload = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'strongpassword',
    };

    const res = await request(app).post('/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();

    const dbUser = await User.findOne({ email: payload.email }).lean();
    expect(dbUser).toBeDefined();
    expect(dbUser.password).toBeDefined();
    expect(dbUser.password).not.toBe(payload.password);
  });

  it('POST /register - duplicate email returns 400', async () => {
    const payload = {
      first_name: 'A',
      last_name: 'B',
      email: 'dup@example.com',
      password: 'strongpassword',
    };
    await new User(payload).save();

    const res = await request(app).post('/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Email already in use/i);
  });

  it('POST /register - short password returns 400', async () => {
    const payload = {
      first_name: 'Short',
      last_name: 'Pwd',
      email: 'shortpwd@example.com',
      password: '123',
    };

    const res = await request(app).post('/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Password must be at least 6 characters long/i);
  });

  it('POST /login - missing credentials returns 400', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Email and password are required/i);
  });

  it('POST /login - invalid credentials returns 401', async () => {
    const payload = { email: 'noone@example.com', password: 'x' };
    const res = await request(app).post('/login').send(payload);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('POST /login - valid credentials returns token', async () => {
    const payload = {
      first_name: 'Login',
      last_name: 'User',
      email: 'login@example.com',
      password: 'mypassword',
    };
    const user = new User(payload);
    await user.save();

    const res = await request(app).post('/login').send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.id).toBeDefined();
    expect(decoded.role).toBeDefined();
  });
});
