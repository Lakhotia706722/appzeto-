const jwt = require('jsonwebtoken');
const { getRedis, getPublisher, getSubscriber } = require('../config/redis');
const logger = require('../utils/logger');

const PUBSUB_CHANNEL = 'taskflow:events';

/**
 * Returns the set of online user IDs for a board from Redis (or empty array if Redis unavailable).
 */
const getOnlineMembers = async (boardId) => {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const members = await redis.smembers(`online:board:${boardId}`);
    return members;
  } catch (err) {
    logger.warn(`Failed to get online members: ${err.message}`);
    return [];
  }
};

/**
 * Initialize Socket.io with JWT auth, board rooms, and Redis pub/sub for horizontal scaling.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // ── JWT authentication middleware ────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Redis pub/sub: re-emit events received from other server instances ────────
  const subscriber = getSubscriber();
  const publisher = getPublisher();

  if (subscriber && publisher) {
    subscriber.subscribe(PUBSUB_CHANNEL, (err) => {
      if (err) logger.error(`Redis subscribe error: ${err.message}`);
      else logger.info(`Subscribed to Redis channel: ${PUBSUB_CHANNEL}`);
    });

    subscriber.on('message', (channel, message) => {
      if (channel !== PUBSUB_CHANNEL) return;
      try {
        const { room, event, data } = JSON.parse(message);
        io.to(room).emit(event, data);
      } catch (e) {
        logger.warn(`Malformed pubsub message: ${e.message}`);
      }
    });

    /**
     * Publish an event through Redis so all server instances emit it.
     * @param {string} room  - socket room, e.g. 'board:abc123'
     * @param {string} event - socket event name
     * @param {object} data  - payload
     */
    io.publishEvent = (room, event, data) => {
      publisher.publish(PUBSUB_CHANNEL, JSON.stringify({ room, event, data }));
    };
    
    logger.info('✅ Socket.io Redis pub/sub enabled for horizontal scaling');
  } else {
    // Fallback: no Redis pub/sub (single server mode)
    io.publishEvent = (room, event, data) => {
      io.to(room).emit(event, data);
    };
    logger.warn('⚠️  Socket.io running in single-server mode (no Redis pub/sub)');
  }

  // ── Connection handler ────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.debug(`Socket connected: userId=${userId} socketId=${socket.id}`);

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    // ── Board room management ──────────────────────────────────────────────────

    socket.on('join-board', async ({ boardId }) => {
      try {
        socket.join(`board:${boardId}`);
        
        const redis = getRedis();
        if (redis) {
          await redis.sadd(`online:board:${boardId}`, userId);
          // Track which boards this socket has joined (for cleanup on disconnect)
          await redis.sadd(`socket:boards:${socket.id}`, boardId);
        }

        const onlineMembers = await getOnlineMembers(boardId);
        io.to(`board:${boardId}`).emit('members:online', { userIds: onlineMembers });
        logger.debug(`User ${userId} joined board:${boardId}`);
      } catch (err) {
        logger.error(`join-board error: ${err.message}`);
      }
    });

    socket.on('leave-board', async ({ boardId }) => {
      try {
        socket.leave(`board:${boardId}`);
        
        const redis = getRedis();
        if (redis) {
          await redis.srem(`online:board:${boardId}`, userId);
          await redis.srem(`socket:boards:${socket.id}`, boardId);
        }

        const onlineMembers = await getOnlineMembers(boardId);
        io.to(`board:${boardId}`).emit('members:online', { userIds: onlineMembers });
      } catch (err) {
        logger.error(`leave-board error: ${err.message}`);
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────────

    socket.on('typing:start', ({ boardId, taskId }) => {
      socket.to(`board:${boardId}`).emit('typing:start', { taskId, userId });
    });

    socket.on('typing:stop', ({ boardId, taskId }) => {
      socket.to(`board:${boardId}`).emit('typing:stop', { taskId, userId });
    });

    // ── Disconnect: clean up Redis sets ───────────────────────────────────────

    socket.on('disconnect', async () => {
      try {
        const redis = getRedis();
        if (redis) {
          const boardIds = await redis.smembers(`socket:boards:${socket.id}`);

          for (const boardId of boardIds) {
            await redis.srem(`online:board:${boardId}`, userId);
            const onlineMembers = await getOnlineMembers(boardId);
            io.to(`board:${boardId}`).emit('members:online', { userIds: onlineMembers });
          }

          await redis.del(`socket:boards:${socket.id}`);
        }
        logger.debug(`Socket disconnected: userId=${userId}`);
      } catch (err) {
        logger.error(`disconnect cleanup error: ${err.message}`);
      }
    });
  });
};

module.exports = initSocket;
