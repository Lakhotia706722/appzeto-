const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./helpers/testApp');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@1234',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects duplicate email', async () => {
    await User.create({ name: 'Existing', email: 'dup@example.com', password: 'Test@1234' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'New User',
      email: 'dup@example.com',
      password: 'Test@1234',
    });
    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'weak@example.com',
      password: 'pass',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const user = new User({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'Login@1234',
      isEmailVerified: true,
    });
    await user.save();
  });

  it('logs in with valid credentials and returns access token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Login@1234',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('rejects invalid password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns current user when authenticated', async () => {
    const user = new User({
      name: 'Me Test',
      email: 'me@example.com',
      password: 'MeTest@1234',
      isEmailVerified: true,
    });
    await user.save();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'me@example.com',
      password: 'MeTest@1234',
    });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
  });
});
