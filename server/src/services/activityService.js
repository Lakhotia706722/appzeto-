const Activity = require('../models/Activity');
const logger = require('../utils/logger');

/**
 * Log a board/task activity event.
 * @param {object} params
 * @param {string} params.boardId
 * @param {string} params.actorId
 * @param {string} params.action
 * @param {string|null} [params.taskId]
 * @param {object} [params.meta]
 */
const log = async ({ boardId, actorId, action, taskId = null, meta = {} }) => {
  try {
    await Activity.create({
      board: boardId,
      actor: actorId,
      action,
      task: taskId,
      meta,
    });
  } catch (err) {
    // Non-critical: log but don't crash request
    logger.error(`ActivityService.log failed: ${err.message}`);
  }
};

/**
 * Fetch paginated activity for a board.
 * @param {string} boardId
 * @param {number} page
 * @param {number} limit
 * @returns {object} { activities, total, page, pages }
 */
const getTimeline = async (boardId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find({ board: boardId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name avatar')
      .populate('task', 'title')
      .lean(),
    Activity.countDocuments({ board: boardId }),
  ]);

  return {
    activities,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

module.exports = { log, getTimeline };
