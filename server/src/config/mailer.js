const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const createTransporter = () => {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  logger.info('Mailer transporter created');
  return transporter;
};

const getMailer = () => {
  if (!transporter) createTransporter();
  return transporter;
};

/**
 * Send an email
 * @param {object} opts - { to, subject, html, text }
 */
const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getMailer();
  const info = await mailer.sendMail({
    from: `"TaskFlow Pro" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { createTransporter, getMailer, sendMail };
