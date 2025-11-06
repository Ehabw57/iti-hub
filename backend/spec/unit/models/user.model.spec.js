const path = require('path');
const mongoHelper = require("../../setup/mongo");
const User = require('../../../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('User model', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoHelper.connectToDB();
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('hashes password before save', async () => {
    const plain = 'mypassword';
    const user = new User({ first_name: 'M', last_name: 'N', email: 'mu@example.com', password: plain });
    await user.save();

    const fromDb = await User.findOne({ email: 'mu@example.com' }).lean();
    expect(fromDb).toBeDefined();
    expect(fromDb.password).toBeDefined();
    expect(fromDb.password).not.toBe(plain);

    const match = await bcrypt.compare(plain, fromDb.password);
    expect(match).toBeTrue();
  });

  it('comparePassword returns true for correct password and false otherwise', async () => {
    const payload = { first_name: 'C', last_name: 'D', email: 'cmp@example.com', password: 'secret123' };
    const user = new User(payload);
    await user.save();

    const fresh = await User.findOne({ email: payload.email });
    const ok = await fresh.comparePassword('secret123');
    expect(ok).toBeTrue();

    const bad = await fresh.comparePassword('wrong');
    expect(bad).toBeFalse();
  });

  it('generateAuthToken returns a JWT containing id and role', async () => {
    const payload = { first_name: 'T', last_name: 'O', email: 'jwt@example.com', password: 'pass123' };
    const user = new User(payload);
    await user.save();

    const token = user.generateAuthToken();
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBeDefined();
    expect(decoded.role).toBeDefined();
  });
});
