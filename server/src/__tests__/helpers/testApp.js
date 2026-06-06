/**
 * Creates a test-ready Express app with Redis and Cloudinary mocked out.
 * Import this instead of requiring '../index' directly in tests.
 */

// ── Environment variables must be set BEFORE the app is required ────────────
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.NODE_ENV = 'test';

// ── Mocks must be set BEFORE the app is required ─────────────────────────────

// Mock Redis so no real connection is needed
jest.mock('../../config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
  getRedis: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    call: jest.fn().mockResolvedValue(null),
    subscribe: jest.fn(),
    on: jest.fn(),
    publish: jest.fn().mockResolvedValue(0),
  }),
  getSubscriber: jest.fn().mockReturnValue({
    subscribe: jest.fn(),
    on: jest.fn(),
  }),
  getPublisher: jest.fn().mockReturnValue({
    publish: jest.fn().mockResolvedValue(0),
  }),
}));

// Mock Cloudinary
jest.mock('../../config/cloudinary', () => ({
  connectCloudinary: jest.fn(),
  cloudinary: { uploader: { destroy: jest.fn().mockResolvedValue({}) } },
}));

// Mock Mailer
jest.mock('../../config/mailer', () => ({
  createTransporter: jest.fn(),
  getMailer: jest.fn(),
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
}));

const { app } = require('../../index');
module.exports = { app };
