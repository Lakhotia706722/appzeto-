const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Verifies JWT from Authorization header (Bearer) or access_token cookie.
 * Attaches req.user (full user document minus password).
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401, 'NO_TOKEN'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token.', 401, 'INVALID_TOKEN'));
  }

  const user = await User.findById(decoded.userId).lean();
  if (!user) {
    return next(new AppError('User no longer exists.', 401, 'USER_NOT_FOUND'));
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;
