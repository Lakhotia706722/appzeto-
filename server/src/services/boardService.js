const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const activityService = require('./activityService');
const { sendMail } = require('../config/mailer');
const { boardInviteTemplate } = require('../utils/emailTemplates');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#71717a', position: 1000, isDefault: true },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6', position: 2000, isDefault: true },
  { id: 'review', title: 'Review', color: '#f59e0b', position: 3000, isDefault: true },
  { id: 'done', title: 'Done', color: '#22c55e', position: 4000, isDefault: true },
];

const DEFAULT_LABELS = [
  { id: uuidv4(), name: 'Bug', color: '#ef4444' },
  { id: uuidv4(), name: 'Feature', color: '#6366f1' },
  { id: uuidv4(), name: 'Improvement', color: '#f59e0b' },
];

/**
 * Create a board, seed default columns/labels, log activity.
 */
const createBoard = async (userId, data) => {
  const board = await Board.create({
    ...data,
    createdBy: userId,
    members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
    columns: DEFAULT_COLUMNS.map((c) => ({ ...c, id: c.id })),
    labels: DEFAULT_LABELS.map((l) => ({ ...l, id: uuidv4() })),
  });

  await activityService.log({
    boardId: board._id,
    actorId: userId,
    action: 'board_created',
    meta: { boardTitle: board.title },
  });

  return board;
};

/**
 * Invite a member to a board by email.
 * Sends an email with a signed JWT invite link.
 */
const inviteMember = async (boardId, inviterUserId, email, role = 'member') => {
  const board = await Board.findById(boardId).populate('members.user', 'email name').lean();
  if (!board) throw new AppError('Board not found.', 404, 'BOARD_NOT_FOUND');

  const alreadyMember = board.members.some((m) => m.user.email === email);
  if (alreadyMember) throw new AppError('User is already a board member.', 409, 'ALREADY_MEMBER');

  // Sign a short-lived invite token
  const inviteToken = jwt.sign(
    { boardId, email, role, invitedBy: inviterUserId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '7d' }
  );

  const acceptUrl = `${process.env.CLIENT_URL}/accept-invite/${inviteToken}`;

  const inviter = board.members.find((m) => m.user._id.toString() === inviterUserId.toString());
  const inviterName = inviter?.user?.name || 'A teammate';

  await sendMail({
    to: email,
    subject: `You're invited to join "${board.title}" on TaskFlow Pro`,
    html: boardInviteTemplate(inviterName, board.title, acceptUrl),
  });

  await activityService.log({
    boardId,
    actorId: inviterUserId,
    action: 'member_invited',
    meta: { email, role },
  });
};

/**
 * Get full board data: populated members, task counts per column.
 */
const getFullBoard = async (boardId, userId) => {
  const board = await Board.findById(boardId)
    .populate('members.user', 'name email avatar lastSeen')
    .populate('createdBy', 'name avatar')
    .lean();

  if (!board) throw new AppError('Board not found.', 404, 'BOARD_NOT_FOUND');

  // Count tasks per column (non-archived only)
  const taskCounts = await Task.aggregate([
    { $match: { board: board._id, isArchived: false } },
    { $group: { _id: '$columnId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  taskCounts.forEach((t) => { countMap[t._id] = t.count; });

  board.columns = board.columns.map((col) => ({
    ...col,
    taskCount: countMap[col.id] || 0,
  }));

  return board;
};

/**
 * Board analytics data.
 */
const getBoardAnalytics = async (boardId, range = 30) => {
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const [allTasks, recentActivities] = await Promise.all([
    Task.find({ board: boardId, isArchived: false })
      .select('status priority assignedTo dueDate createdAt columnId')
      .lean(),
    Activity.find({ board: boardId, action: 'task_completed', createdAt: { $gte: since } })
      .select('createdAt actor')
      .lean(),
  ]);

  const now = new Date();

  // Status distribution
  const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
  const priorityCounts = { none: 0, low: 0, medium: 0, high: 0, urgent: 0 };
  const memberContribution = {};
  let overdueCount = 0;

  allTasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') overdueCount++;
    (t.assignedTo || []).forEach((uid) => {
      const key = uid.toString();
      memberContribution[key] = (memberContribution[key] || 0) + 1;
    });
  });

  const totalTasks = allTasks.length;
  const completedTasks = statusCounts.done;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Daily completion trend (last `range` days)
  const dailyTrend = [];
  for (let i = range - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const count = recentActivities.filter(
      (a) => new Date(a.createdAt) >= dayStart && new Date(a.createdAt) <= dayEnd
    ).length;

    dailyTrend.push({ date: dayStart.toISOString().split('T')[0], completed: count });
  }

  return {
    totalTasks,
    completedTasks,
    overdueCount,
    completionRate,
    statusCounts,
    priorityCounts,
    memberContribution,
    dailyTrend,
  };
};

module.exports = { createBoard, inviteMember, getFullBoard, getBoardAnalytics };
