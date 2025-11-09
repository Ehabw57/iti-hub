const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

describe('Auth Controller', () => {

  describe('POST /register', () => {
    it('should return error if email already exists', async () => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve({ email: 'toti@example.com' }));

      const res = await request(app).post('/register').send({
        first_name: 'Toti',
        last_name: 'Kady',
        email: 'toti@example.com',
        password: '123456',
        role: 'user'
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should reject short passwords', async () => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

      const res = await request(app).post('/register').send({
        first_name: 'Aya',
        last_name: 'Dev',
        email: 'aya@example.com',
        password: '123',
        role: 'user'
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should create user successfully', async () => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(User.prototype, 'save').and.returnValue(Promise.resolve(true));
      spyOn(User.prototype, 'toObject').and.returnValue({
        first_name: 'Aya',
        last_name: 'Dev',
        email: 'aya@example.com',
        role: 'user'
      });

      const res = await request(app).post('/register').send({
        first_name: 'Aya',
        last_name: 'Dev',
        email: 'aya@example.com',
        password: '123456',
        role: 'user'
      });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('aya@example.com');
    });
  });

  describe('POST /login', () => {
    it('should return 400 if fields missing', async () => {
      const res = await request(app).post('/login').send({ email: 'aya@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email and password are required');
    });

    it('should return 401 for invalid credentials', async () => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

      const res = await request(app).post('/login').send({
        email: 'wrong@example.com',
        password: 'wrongpass'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should login successfully', async () => {
      const mockUser = {
        comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(true)),
        generateAuthToken: jasmine.createSpy().and.returnValue('mockToken123')
      };

      spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

      const res = await request(app).post('/login').send({
        email: 'aya@example.com',
        password: '123456'
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('mockToken123');
    });
  });
});
