const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendMail } = require('../config/mailer');
const { taskAssignedTemplate, dueDateReminderTemplate } = require('../utils/emailTemplates');

let _io; // injected on startup

const setIo = (io) => { _io = io; };

/**
 * Create a notification and emit it to the recipient via Socket.io.
 */
const create = async ({ type, actorId, recipientId, boardId, taskId, message }) => {
  try {
    if (actorId && actorId.toString() === recipientId.toString()) return; // no self-notifs

    const notification = await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      board: boardId,
      task: taskId,
      message,
    });

    const populated = await Notification.findById(notification._id)
      .populate('actor', 'name avatar')
      .populate('board', 'title')
      .populate('task', 'title')
      .lean();

    // Emit to user-specific socket room
    if (_io) {
      _io.to(`user:${recipientId}`).emit('notification:new', { notification: populated });
    }

    return populated;
  } catch (err) {
    logger.error(`notificationService.create failed: ${err.message}`);
  }
};

/**
 * Parse @mentions in comment content and create notifications.
 * Mention format: @userId (we store IDs in the mentions array after parsing)
 */
const notifyMentions = async (comment, boardId, taskId) => {
  if (!comment.mentions || comment.mentions.length === 0) return;
  const promises = comment.mentions.map((userId) =>
    create({
      type: 'task_mentioned',
      actorId: comment.author,
      recipientId: userId,
      boardId,
      taskId,
      message: `mentioned you in a comment`,
    })
  );
  await Promise.allSettled(promises);
};

/**
 * Notify a user they've been assigned to a task.
 */
const notifyAssignment = async (task, assignedByUserId, assigneeId) => {
  await create({
    type: 'task_assigned',
    actorId: assignedByUserId,
    recipientId: assigneeId,
    boardId: task.board,
    taskId: task._id,
    message: `assigned you to "${task.title}"`,
  });

  // Also send email if user preferences allow
  try {
    const [assignee, assigner] = await Promise.all([
      User.findById(assigneeId).lean(),
      User.findById(assignedByUserId).lean(),
    ]);
    if (assignee && assignee.preferences?.notifications) {
      const taskUrl = `${process.env.CLIENT_URL}/boards/${task.board}`;
      await sendMail({
        to: assignee.email,
        subject: `You've been assigned: "${task.title}"`,
        html: taskAssignedTemplate(assigner.name, task.title, 'your board', taskUrl),
      });
    }
  } catch (emailErr) {
    logger.warn(`Assignment email failed: ${emailErr.message}`);
  }
};

/**
 * Cron job handler: notify watchers + assignees of tasks due in the next 24 hours.
 */
const sendDueDateReminders = async () => {
  const Task = require('../models/Task');
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: in24h },
    isArchived: false,
  })
    .populate('board', 'title')
    .lean();

  logger.info(`Due-date reminder: ${tasks.length} tasks due within 24h`);

  for (const task of tasks) {
    const recipients = [
      ...new Set([
        ...(task.assignedTo || []).map((id) => id.toString()),
        ...(task.watchedBy || []).map((id) => id.toString()),
      ]),
    ];

    for (const recipientId of recipients) {
      await create({
        type: 'task_due_soon',
        actorId: null,
        recipientId,
        boardId: task.board._id,
        taskId: task._id,
        message: `"${task.title}" is due within 24 hours`,
      });

      // Email reminder
      try {
        const user = await User.findById(recipientId).lean();
        if (user && user.preferences?.notifications) {
          const taskUrl = `${process.env.CLIENT_URL}/boards/${task.board._id}`;
          await sendMail({
            to: user.email,
            subject: `Task due soon: "${task.title}"`,
            html: dueDateReminderTemplate(task.title, task.board.title, task.dueDate, taskUrl),
          });
        }
      } catch (emailErr) {
        logger.warn(`Due-date email failed: ${emailErr.message}`);
      }
    }
  }
};

module.exports = { setIo, create, notifyMentions, notifyAssignment, sendDueDateReminders };
