const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Lazily get (or create) a RedisStore for rate limiting.
 * Falls back to in-memory store when Redis is not available (tests / dev without Redis).
 */
const buildStore = (prefix) => {
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { getRedis } = require('../config/redis');
    const client = getRedis();
    if (!client) throw new Error('Redis not ready');

    return new RedisStore({
      sendCommand: (...args) => client.call(...args),
      prefix,
    });
  } catch {
    // In-memory fallback (development / test environments)
    logger.warn(`Rate limiter using in-memory store for prefix=${prefix}`);
    return undefined; // undefined → express-rate-limit uses its built-in memory store
  }
};

/**
 * Auth routes: 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
  },
  // store is built lazily on first request so Redis is already connected by then
  skip: () => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
    });
  },
});

/**
 * General API routes: 300 requests per 15 minutes per user (falls back to IP)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  message: {
    success: false,
    error: { message: 'Rate limit exceeded. Slow down.', code: 'RATE_LIMITED' },
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Rate limit exceeded. Slow down.', code: 'RATE_LIMITED' },
    });
  },
});

/**
 * Attach Redis stores after server startup (called from index.js after connectRedis()).
 */
const attachRedisStores = () => {
  try {
    const authStore = buildStore('rl:auth:');
    const apiStore = buildStore('rl:api:');
    if (authStore) authLimiter.store = authStore;
    if (apiStore) apiLimiter.store = apiStore;
    logger.info('Rate limiter Redis stores attached');
  } catch (err) {
    logger.warn(`Rate limiter Redis store attachment failed: ${err.message}`);
  }
};

module.exports = { authLimiter, apiLimiter, attachRedisStores };
