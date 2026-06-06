const Board = require('../models/Board');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.globalSearch = asyncHandler(async (req, res, next) => {
  const { q, boards } = req.query;
  if (!q || q.trim().length < 2) {
    return next(new AppError('Search query must be at least 2 characters.', 400, 'VALIDATION_ERROR'));
  }

  const regex = { $regex: q.trim(), $options: 'i' };

  // Find boards user has access to
  const userBoards = await Board.find({ 'members.user': req.user._id, isArchived: false })
    .select('_id title')
    .lean();

  let boardIds = userBoards.map((b) => b._id);

  // Optionally filter to specific board IDs
  if (boards) {
    const requestedIds = boards.split(',');
    boardIds = boardIds.filter((id) => requestedIds.includes(id.toString()));
  }

  const [matchingBoards, matchingTasks] = await Promise.all([
    Board.find({
      _id: { $in: boardIds },
      $or: [{ title: regex }, { description: regex }],
    })
      .select('title description coverColor members')
      .limit(5)
      .lean(),

    Task.find({
      board: { $in: boardIds },
      isArchived: false,
      $or: [{ title: regex }, { description: regex }],
    })
      .select('title description priority status columnId board dueDate assignedTo')
      .populate('board', 'title')
      .populate('assignedTo', 'name avatar')
      .limit(20)
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      boards: matchingBoards,
      tasks: matchingTasks,
    },
  });
});
