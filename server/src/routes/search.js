const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware, apiLimiter);
router.get('/', searchController.globalSearch);

module.exports = router;
