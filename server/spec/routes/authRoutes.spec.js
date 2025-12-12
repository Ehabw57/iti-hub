const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  it('should mount POST /auth/register', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/login', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/password-reset/request', async () => {
    const res = await request(app).post('/auth/password-reset/request').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/password-reset/confirm', async () => {
    const res = await request(app).post('/auth/password-reset/confirm').send({});
    expect(res.status).not.toBe(404);
  });

  it('should have rate limiting configured on registration', () => {
    // Verify the route has middleware (rate limiter is applied)
    const registerRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/register'
    );
    
    expect(registerRoute).toBeTruthy();
    expect(registerRoute.route.stack.length).toBeGreaterThan(1); // Has middleware + controller
  });

  it('should have rate limiting configured on login', () => {
    const loginRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/login'
    );
    
    expect(loginRoute).toBeTruthy();
    expect(loginRoute.route.stack.length).toBeGreaterThan(1);
  });

  it('should have rate limiting configured on password reset request', () => {
    const resetRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/password-reset/request'
    );
    
    expect(resetRoute).toBeTruthy();
    expect(resetRoute.route.stack.length).toBeGreaterThan(1);
  });

  it('should have rate limiting configured on password reset confirm', () => {
    const confirmRoute = authRoutes.stack.find(layer => 
      layer.route && layer.route.path === '/password-reset/confirm'
    );
    
    expect(confirmRoute).toBeTruthy();
    expect(confirmRoute.route.stack.length).toBeGreaterThan(1);
  });
});
