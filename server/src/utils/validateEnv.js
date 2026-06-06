/**
 * Validates required environment variables and security settings on startup.
 * Fails fast if critical configuration is missing or insecure.
 */

const logger = require('./logger');

const REQUIRED_VARS = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
];

const OPTIONAL_VARS = [
  'REDIS_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // Check required variables
  REQUIRED_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Security checks for production
  if (process.env.NODE_ENV === 'production') {
    // JWT secrets must be strong
    const accessSecret = process.env.JWT_ACCESS_SECRET || '';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || '';

    if (accessSecret.length < 32) {
      errors.push('JWT_ACCESS_SECRET must be at least 32 characters in production');
    }

    if (refreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }

    // Check for default/weak secrets
    const weakSecrets = [
      'your_access_secret_change_me',
      'your_refresh_secret_change_me',
      'secret',
      'password',
      '123456',
    ];

    if (weakSecrets.some((weak) => accessSecret.includes(weak))) {
      errors.push('JWT_ACCESS_SECRET appears to be a default or weak value');
    }

    if (weakSecrets.some((weak) => refreshSecret.includes(weak))) {
      errors.push('JWT_REFRESH_SECRET appears to be a default or weak value');
    }

    // HTTPS check
    if (process.env.CLIENT_URL && !process.env.CLIENT_URL.startsWith('https://')) {
      warnings.push('CLIENT_URL should use HTTPS in production');
    }

    // Check Redis is configured (recommended for production)
    if (!process.env.REDIS_URL) {
      warnings.push('REDIS_URL not set - rate limiting will use in-memory store');
    }

    // Check if file upload is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      warnings.push('Cloudinary not configured - file uploads will fail');
    }

    // Check if email is configured
    if (!process.env.SMTP_HOST) {
      warnings.push('SMTP not configured - email notifications will fail');
    }
  }

  // Log optional vars status
  OPTIONAL_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      logger.debug(`Optional environment variable not set: ${varName}`);
    }
  });

  // Display warnings
  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      logger.warn(`⚠️  ${warning}`);
    });
  }

  // Fail on errors
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach((error) => {
      logger.error(`   - ${error}`);
    });
    logger.error('\nPlease fix the above issues before starting the server.');
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
};

module.exports = validateEnv;
