/**
 * Email HTML templates for TaskFlow Pro notifications.
 */

const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TaskFlow Pro</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #0f0f10; color: #fafafa; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #18181b; border-radius: 10px; padding: 40px; }
    .logo { font-size: 22px; font-weight: 700; color: #6366f1; margin-bottom: 32px; }
    .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 7px; font-weight: 600; margin-top: 24px; }
    .footer { margin-top: 40px; font-size: 12px; color: #71717a; }
    p { line-height: 1.6; color: #a1a1aa; }
    h2 { color: #fafafa; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">TaskFlow Pro</div>
    ${content}
    <div class="footer">You are receiving this email because you have an account on TaskFlow Pro.</div>
  </div>
</body>
</html>
`;

const emailVerificationTemplate = (name, verifyUrl) =>
  baseWrapper(`
    <h2>Verify your email address</h2>
    <p>Hi ${name},</p>
    <p>Thanks for signing up. Please verify your email address to get started:</p>
    <a class="btn" href="${verifyUrl}">Verify Email</a>
    <p style="margin-top:24px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);

const passwordResetTemplate = (name, resetUrl) =>
  baseWrapper(`
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <a class="btn" href="${resetUrl}">Reset Password</a>
    <p style="margin-top:24px;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
  `);

const boardInviteTemplate = (inviterName, boardTitle, acceptUrl) =>
  baseWrapper(`
    <h2>You've been invited to a board</h2>
    <p><strong>${inviterName}</strong> has invited you to collaborate on the board <strong>"${boardTitle}"</strong>.</p>
    <a class="btn" href="${acceptUrl}">Accept Invitation</a>
    <p style="margin-top:24px;">This invitation expires in 7 days.</p>
  `);

const taskAssignedTemplate = (assignerName, taskTitle, boardTitle, taskUrl) =>
  baseWrapper(`
    <h2>You've been assigned a task</h2>
    <p><strong>${assignerName}</strong> assigned you to the task <strong>"${taskTitle}"</strong> on board <strong>"${boardTitle}"</strong>.</p>
    <a class="btn" href="${taskUrl}">View Task</a>
  `);

const dueDateReminderTemplate = (taskTitle, boardTitle, dueDate, taskUrl) =>
  baseWrapper(`
    <h2>Task due soon</h2>
    <p>The task <strong>"${taskTitle}"</strong> on board <strong>"${boardTitle}"</strong> is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
    <a class="btn" href="${taskUrl}">View Task</a>
  `);

const weeklyDigestTemplate = (name, stats) =>
  baseWrapper(`
    <h2>Your weekly digest</h2>
    <p>Hi ${name}, here's your TaskFlow Pro activity summary for the week:</p>
    <ul>
      <li>Tasks completed: <strong>${stats.completed}</strong></li>
      <li>Tasks overdue: <strong>${stats.overdue}</strong></li>
      <li>Comments made: <strong>${stats.comments}</strong></li>
    </ul>
    <a class="btn" href="${process.env.CLIENT_URL}/boards">Go to Boards</a>
  `);

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate,
  boardInviteTemplate,
  taskAssignedTemplate,
  dueDateReminderTemplate,
  weeklyDigestTemplate,
};
