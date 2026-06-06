const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const Board = require('../models/Board');
const activityService = require('./activityService');
const notificationService = require('./notificationService');
const { getAppendPosition, getInsertPosition, needsRebalance, rebalance } = require('../utils/position');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Get position for a new task appended to end of column.
 */
const getPosition = async (boardId, columnId, afterTaskId = null) => {
  if (afterTaskId) {
    const afterTask = await Task.findById(afterTaskId).select('position').lean();
    const nextTask = await Task.findOne({
      board: boardId,
      columnId,
      position: { $gt: afterTask.position },
      isArchived: false,
    })
      .sort({ position: 1 })
      .select('position')
      .lean();

    return getInsertPosition(afterTask.position, nextTask ? nextTask.position : null);
  }

  const lastTask = await Task.findOne({ board: boardId, columnId, isArchived: false })
    .sort({ position: -1 })
    .select('position')
    .lean();

  return getAppendPosition(lastTask ? lastTask.position : null);
};

/**
 * Reindex all tasks in a column when floating-point positions are exhausted.
 */
const resolvePositionConflict = async (boardId, columnId) => {
  const tasks = await Task.find({ board: boardId, columnId, isArchived: false })
    .sort({ position: 1 })
    .select('_id position')
    .lean();

  const rebalanced = rebalance(tasks);
  const bulkOps = rebalanced.map((t) => ({
    updateOne: { filter: { _id: t._id }, update: { $set: { position: t.position } } },
  }));

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
    logger.info(`Rebalanced ${bulkOps.length} tasks in column ${columnId}`);
  }
};

/**
 * Create a task, log activity, notify assignees.
 */
const createTask = async (boardId, userId, data) => {
  const position = await getPosition(boardId, data.columnId);

  const task = await Task.create({
    ...data,
    board: boardId,
    createdBy: userId,
    position,
  });

  await activityService.log({
    boardId,
    actorId: userId,
    action: 'task_created',
    taskId: task._id,
    meta: { taskTitle: task.title, columnId: task.columnId },
  });

  // Notify assignees
  if (data.assignedTo && data.assignedTo.length > 0) {
    for (const assigneeId of data.assignedTo) {
      await notificationService.notifyAssignment(task, userId, assigneeId);
    }
  }

  return task;
};

/**
 * Map column ID to a status string.
 */
const columnToStatus = (columnId) => {
  const map = { todo: 'todo', 'in-progress': 'in-progress', review: 'review', done: 'done' };
  return map[columnId] || 'todo';
};

/**
 * Move a task to a new column/position. Handles conflict resolution and activity logging.
 */
const moveTask = async (taskId, userId, columnId, position, io) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');

  const fromColumn = task.columnId;
  task.columnId = columnId;
  task.position = position;
  task.status = columnToStatus(columnId);
  await task.save();

  // Check if rebalance needed
  const columnTasks = await Task.find({ board: task.board, columnId, isArchived: false })
    .select('position')
    .lean();
  if (needsRebalance(columnTasks)) {
    await resolvePositionConflict(task.board.toString(), columnId);
  }

  await activityService.log({
    boardId: task.board.toString(),
    actorId: userId,
    action: 'task_moved',
    taskId: task._id,
    meta: { fromColumn, toColumn: columnId, taskTitle: task.title },
  });

  // If moved to done, log completion
  if (columnId === 'done' && fromColumn !== 'done') {
    await activityService.log({
      boardId: task.board.toString(),
      actorId: userId,
      action: 'task_completed',
      taskId: task._id,
      meta: { taskTitle: task.title },
    });
  }

  // Emit socket event for real-time sync
  if (io) {
    io.to(`board:${task.board}`).emit('task:moved', {
      taskId: task._id,
      fromColumn,
      toColumn: columnId,
      position,
      movedBy: userId,
    });
  }

  return task;
};

module.exports = { createTask, moveTask, getPosition, resolvePositionConflict };
