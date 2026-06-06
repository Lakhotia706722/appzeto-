const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./helpers/testApp');
const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');

let mongoServer;
let accessToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Board.deleteMany({});
  await Task.deleteMany({});

  const user = new User({ name: 'Board Tester', email: 'boardtest@example.com', password: 'BoardTest@1', isEmailVerified: true });
  await user.save();

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'boardtest@example.com',
    password: 'BoardTest@1',
  });
  accessToken = loginRes.body.data?.accessToken;
});

describe('POST /api/boards', () => {
  it('creates a board with 4 default columns', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'My Test Board', coverColor: '#6366f1' });

    expect(res.status).toBe(201);
    expect(res.body.data.board.title).toBe('My Test Board');
    expect(res.body.data.board.columns).toHaveLength(4);
  });
});

describe('GET /api/boards', () => {
  it('returns boards where user is a member', async () => {
    await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Board 1' });

    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.boards.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/boards/:boardId', () => {
  it('updates board title (admin only)', async () => {
    const createRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Original Title' });
    const boardId = createRes.body.data.board._id;

    const res = await request(app)
      .put(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.board.title).toBe('Updated Title');
  });
});

describe('DELETE /api/boards/:boardId', () => {
  it('allows owner to delete board', async () => {
    const createRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'To Delete' });
    const boardId = createRes.body.data.board._id;

    const res = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe('Board column management', () => {
  it('adds a custom column', async () => {
    const createRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Column Board' });
    const boardId = createRes.body.data.board._id;

    const res = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Backlog', color: '#8b5cf6' });

    expect(res.status).toBe(201);
    expect(res.body.data.column.title).toBe('Backlog');
  });
});
