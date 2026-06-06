const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendMail } = require('../config/mailer');
const { emailVerificationTemplate, passwordResetTemplate } = require('../utils/emailTemplates');
const { cloudinary } = require('../config/cloudinary');

// ─── Token Helpers ────────────────────────────────────────────────────────────

const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR', errors.array()[0].path));
  }

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) return next(new AppError('Email already registered.', 409, 'DUPLICATE_KEY', 'email'));

  const user = new User({ name, email, password });
  const rawToken = user.generateEmailVerificationToken();
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  try {
    await sendMail({
      to: email,
      subject: 'Verify your TaskFlow Pro account',
      html: emailVerificationTemplate(name, verifyUrl),
    });
  } catch (emailErr) {
    // Don't block registration if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR'));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Store hashed refresh token
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken]; // keep last 5
  user.lastSeen = new Date();
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshTokens;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;

  res.json({ success: true, data: { user: userObj, accessToken } });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken && req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  clearTokenCookies(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refresh_token;
  if (!token) return next(new AppError('Refresh token required.', 401, 'NO_REFRESH_TOKEN'));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearTokenCookies(res);
    return next(new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN'));
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    clearTokenCookies(res);
    return next(new AppError('Refresh token revoked.', 401, 'REFRESH_TOKEN_REVOKED'));
  }

  // Rotate refresh token
  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  setTokenCookies(res, newAccessToken, newRefreshToken);
  res.json({ success: true, data: { accessToken: newAccessToken } });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  res.json({ success: true, data: { user } });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, preferences } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (preferences) updates.preferences = preferences;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  res.json({ success: true, data: { user } });
});

exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400, 'NO_FILE'));

  // Delete old avatar from Cloudinary
  const currentUser = await User.findById(req.user._id).select('avatarPublicId');
  if (currentUser.avatarPublicId) {
    await cloudinary.uploader.destroy(currentUser.avatarPublicId);
  }

  // Upload buffer to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'taskflow/avatars', transformation: [{ width: 200, height: 200, crop: 'fill' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(req.file.buffer);
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url, avatarPublicId: result.public_id },
    { new: true }
  ).lean();

  res.json({ success: true, data: { user } });
});

exports.deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('avatarPublicId');
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }
  await User.findByIdAndUpdate(req.user._id, { avatar: null, avatarPublicId: null });
  res.json({ success: true, message: 'Avatar removed.' });
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) return next(new AppError('Token is invalid or has expired.', 400, 'INVALID_TOKEN'));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully.' });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const rawToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  try {
    await sendMail({
      to: email,
      subject: 'Reset your TaskFlow Pro password',
      html: passwordResetTemplate(user.name, resetUrl),
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return next(new AppError('Email could not be sent.', 500, 'EMAIL_FAILED'));
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) return next(new AppError('Token is invalid or has expired.', 400, 'INVALID_TOKEN'));

  const { password } = req.body;
  if (!password || password.length < 8) {
    return next(new AppError('Password must be at least 8 characters.', 400, 'VALIDATION_ERROR'));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  clearTokenCookies(res);
  res.json({ success: true, message: 'Password reset successful. Please log in.' });
});
