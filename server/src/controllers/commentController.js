const Comment = require('../models/Comment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');

/**
 * Parse @[userId] mentions from comment content.
 * Returns array of user IDs.
 */
const parseMentions = (content) => {
  const mentionRegex = /@\[([a-f0-9]{24})\]/g;
  const ids = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return [...new Set(ids)];
};

exports.getComments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ task: req.params.taskId, parentComment: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('mentions', 'name avatar')
      .populate({
        path: 'reactions.users',
        select: 'name avatar',
      })
      .lean(),
    Comment.countDocuments({ task: req.params.taskId, parentComment: null }),
  ]);

  // Attach replies for each top-level comment
  const commentIds = comments.map((c) => c._id);
  const replies = await Comment.find({ parentComment: { $in: commentIds } })
    .sort({ createdAt: 1 })
    .populate('author', 'name avatar')
    .populate('mentions', 'name avatar')
    .lean();

  const replyMap = {};
  replies.forEach((r) => {
    const key = r.parentComment.toString();
    if (!replyMap[key]) replyMap[key] = [];
    replyMap[key].push(r);
  });

  const enriched = comments.map((c) => ({
    ...c,
    replies: replyMap[c._id.toString()] || [],
  }));

  res.json({
    success: true,
    data: { comments: enriched, total, page, pages: Math.ceil(total / limit) },
  });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { content, parentComment } = req.body;
  const mentions = parseMentions(content);

  const comment = await Comment.create({
    task: req.params.taskId,
    board: req.params.boardId,
    author: req.user._id,
    content,
    mentions,
    parentComment: parentComment || null,
  });

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name avatar')
    .populate('mentions', 'name avatar')
    .lean();

  // Activity log
  await activityService.log({
    boardId: req.params.boardId,
    actorId: req.user._id,
    action: 'comment_added',
    taskId: req.params.taskId,
    meta: { preview: content.slice(0, 100) },
  });

  // Notify @mentions
  if (mentions.length > 0) {
    await notificationService.notifyMentions(comment, req.params.boardId, req.params.taskId);
  }

  // Notify watchers (task_commented)
  const task = await Task.findById(req.params.taskId).select('watchedBy title').lean();
  const notifyUsers = [
    ...(task.watchedBy || []).map((id) => id.toString()),
  ].filter((id) => id !== req.user._id.toString());

  for (const userId of [...new Set(notifyUsers)]) {
    await notificationService.create({
      type: 'task_commented',
      actorId: req.user._id,
      recipientId: userId,
      boardId: req.params.boardId,
      taskId: req.params.taskId,
      message: `commented on "${task.title}"`,
    });
  }

  // Emit socket event
  req.io?.to(`board:${req.params.boardId}`).emit('comment:added', {
    taskId: req.params.taskId,
    comment: populated,
  });

  res.status(201).json({ success: true, data: { comment: populated } });
});

exports.editComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return next(new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND'));

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own comments.', 403, 'FORBIDDEN'));
  }

  comment.content = req.body.content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.mentions = parseMentions(req.body.content);
  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name avatar')
    .lean();

  await activityService.log({
    boardId: req.params.boardId,
    actorId: req.user._id,
    action: 'comment_edited',
    taskId: req.params.taskId,
    meta: { commentId: comment._id },
  });

  req.io?.to(`board:${req.params.boardId}`).emit('comment:updated', {
    commentId: comment._id,
    content: comment.content,
  });

  res.json({ success: true, data: { comment: populated } });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return next(new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND'));

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const canDelete = isAuthor || req.memberRole === 'owner' || req.memberRole === 'admin';
  if (!canDelete) return next(new AppError('Insufficient permissions.', 403, 'FORBIDDEN'));

  await comment.deleteOne();
  // Delete replies too
  await Comment.deleteMany({ parentComment: req.params.commentId });

  await activityService.log({
    boardId: req.params.boardId,
    actorId: req.user._id,
    action: 'comment_deleted',
    taskId: req.params.taskId,
    meta: { commentId: req.params.commentId },
  });

  req.io?.to(`board:${req.params.boardId}`).emit('comment:deleted', {
    commentId: req.params.commentId,
    taskId: req.params.taskId,
  });

  res.json({ success: true, message: 'Comment deleted.' });
});

exports.addReaction = asyncHandler(async (req, res, next) => {
  const { emoji } = req.body;
  if (!emoji) return next(new AppError('Emoji required.', 400, 'VALIDATION_ERROR'));

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return next(new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND'));

  const userId = req.user._id;
  const reaction = comment.reactions.find((r) => r.emoji === emoji);

  if (reaction) {
    const hasReacted = reaction.users.some((u) => u.toString() === userId.toString());
    if (hasReacted) {
      reaction.users.pull(userId);
      if (reaction.users.length === 0) {
        comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      reaction.users.push(userId);
    }
  } else {
    comment.reactions.push({ emoji, users: [userId] });
  }

  await comment.save();
  res.json({ success: true, data: { reactions: comment.reactions } });
});
