const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./helpers/testApp');
const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');

let mongoServer;
let accessToken;
let boardId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_ACCESS_SECRET = 'test_access_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  process.env.CLIENT_URL = 'http://localhost:5173';
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Board.deleteMany({});
  await Task.deleteMany({});

  await request(app).post('/api/auth/register').send({
    name: 'Task Tester',
    email: 'tasktest@example.com',
    password: 'TaskTest@1',
  });
  await User.findOneAndUpdate({ email: 'tasktest@example.com' }, { isEmailVerified: true });

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'tasktest@example.com',
    password: 'TaskTest@1',
  });
  accessToken = loginRes.body.data?.accessToken;

  const boardRes = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: 'Test Board' });
  boardId = boardRes.body.data?.board?._id;
});

describe('POST /api/boards/:boardId/tasks', () => {
  it('creates a task in a column', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Test Task', columnId: 'todo', priority: 'medium' });

    expect(res.status).toBe(201);
    expect(res.body.data.task.title).toBe('Test Task');
    expect(res.body.data.task.columnId).toBe('todo');
    expect(res.body.data.task.position).toBeGreaterThan(0);
  });
});

describe('POST /api/boards/:boardId/tasks/:taskId/move', () => {
  it('moves a task to a different column', async () => {
    const createRes = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Move Me', columnId: 'todo', priority: 'low' });

    const taskId = createRes.body.data.task._id;

    const moveRes = await request(app)
      .post(`/api/boards/${boardId}/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ columnId: 'done', position: 1000 });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.task.columnId).toBe('done');
  });
});

describe('GET /api/boards/:boardId/tasks', () => {
  it('returns tasks with filters applied', async () => {
    // Create two tasks with different priorities
    await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'High Task', columnId: 'todo', priority: 'high' });

    await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Low Task', columnId: 'todo', priority: 'low' });

    const res = await request(app)
      .get(`/api/boards/${boardId}/tasks?priority=high`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].priority).toBe('high');
  });
});
