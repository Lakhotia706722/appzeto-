const Board = require('../models/Board');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ROLE_HIERARCHY = { viewer: 0, member: 1, admin: 2, owner: 3 };

/**
 * Middleware factory that checks board membership and minimum role.
 * Attaches req.board and req.memberRole to the request.
 * @param {'viewer'|'member'|'admin'|'owner'} minRole
 */
const boardAccessMiddleware = (minRole = 'viewer') =>
  asyncHandler(async (req, res, next) => {
    const boardId = req.params.boardId;
    if (!boardId) return next(new AppError('Board ID required.', 400, 'MISSING_BOARD_ID'));

    const board = await Board.findById(boardId).lean();
    if (!board) return next(new AppError('Board not found.', 404, 'BOARD_NOT_FOUND'));

    if (board.isArchived && minRole !== 'viewer') {
      return next(new AppError('This board is archived.', 403, 'BOARD_ARCHIVED'));
    }

    const membership = board.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!membership) {
      return next(new AppError('You are not a member of this board.', 403, 'NOT_A_MEMBER'));
    }

    const userRank = ROLE_HIERARCHY[membership.role] ?? -1;
    const requiredRank = ROLE_HIERARCHY[minRole] ?? 0;

    if (userRank < requiredRank) {
      return next(
        new AppError(
          `Insufficient permissions. Required: ${minRole}, yours: ${membership.role}`,
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    req.board = board;
    req.memberRole = membership.role;
    next();
  });

module.exports = boardAccessMiddleware;
