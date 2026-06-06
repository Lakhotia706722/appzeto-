const express = require('express');
const router = express.Router({ mergeParams: true }); // inherits :boardId
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/auth');
const boardAccess = require('../middlewares/boardAccess');
const upload = require('../middlewares/upload');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware, boardAccess('viewer'), apiLimiter);

// Tasks
router.get('/', taskController.getTasks);
router.post('/', boardAccess('member'), taskController.createTask);
router.get('/:taskId', taskController.getTask);
router.put('/:taskId', boardAccess('member'), taskController.updateTask);
router.delete('/:taskId', boardAccess('member'), taskController.deleteTask);
router.post('/:taskId/move', boardAccess('member'), taskController.moveTask);
router.post('/:taskId/archive', boardAccess('member'), taskController.archiveTask);
router.post('/:taskId/watch', taskController.toggleWatch);
router.post('/:taskId/assign', boardAccess('member'), taskController.assignUser);

// Checklist
router.post('/:taskId/checklist', boardAccess('member'), taskController.addChecklistItem);
router.put('/:taskId/checklist/:itemId', boardAccess('member'), taskController.updateChecklistItem);
router.delete('/:taskId/checklist/:itemId', boardAccess('member'), taskController.deleteChecklistItem);

// Attachments
router.post('/:taskId/attachments', boardAccess('member'), upload.single('file'), taskController.uploadAttachment);
router.delete('/:taskId/attachments/:attachmentId', boardAccess('member'), taskController.deleteAttachment);

// Time tracking
router.post('/:taskId/time/start', boardAccess('member'), taskController.startTimer);
router.post('/:taskId/time/stop', boardAccess('member'), taskController.stopTimer);

// Comments (nested)
router.get('/:taskId/comments', commentController.getComments);
router.post('/:taskId/comments', boardAccess('member'), commentController.addComment);
router.put('/:taskId/comments/:commentId', boardAccess('member'), commentController.editComment);
router.delete('/:taskId/comments/:commentId', boardAccess('member'), commentController.deleteComment);
router.post('/:taskId/comments/:commentId/reactions', boardAccess('member'), commentController.addReaction);

module.exports = router;
