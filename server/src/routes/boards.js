const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const authMiddleware = require('../middlewares/auth');
const boardAccess = require('../middlewares/boardAccess');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware, apiLimiter);

// Board CRUD
router.get('/', boardController.getBoards);
router.post('/', boardController.createBoard);
router.get('/:boardId', boardAccess('viewer'), boardController.getBoard);
router.put('/:boardId', boardAccess('admin'), boardController.updateBoard);
router.delete('/:boardId', boardAccess('owner'), boardController.deleteBoard);
router.post('/:boardId/archive', boardAccess('admin'), boardController.archiveBoard);
router.post('/:boardId/star', boardAccess('viewer'), boardController.starBoard);

// Members
router.post('/:boardId/invite', boardAccess('admin'), boardController.inviteMember);
router.post('/accept-invite/:token', boardController.acceptInvite);
router.put('/:boardId/members/:userId', boardAccess('admin'), boardController.updateMemberRole);
router.delete('/:boardId/members/:userId', boardAccess('member'), boardController.removeMember);

// Columns
router.post('/:boardId/columns', boardAccess('admin'), boardController.addColumn);
router.put('/:boardId/columns/reorder', boardAccess('admin'), boardController.reorderColumns);
router.put('/:boardId/columns/:columnId', boardAccess('admin'), boardController.updateColumn);
router.delete('/:boardId/columns/:columnId', boardAccess('admin'), boardController.deleteColumn);

// Labels
router.post('/:boardId/labels', boardAccess('admin'), boardController.addLabel);
router.put('/:boardId/labels/:labelId', boardAccess('admin'), boardController.updateLabel);
router.delete('/:boardId/labels/:labelId', boardAccess('admin'), boardController.deleteLabel);

// Activity & Analytics
router.get('/:boardId/activity', boardAccess('viewer'), boardController.getBoardActivity);
router.get('/:boardId/analytics', boardAccess('viewer'), boardController.getBoardAnalytics);

module.exports = router;
