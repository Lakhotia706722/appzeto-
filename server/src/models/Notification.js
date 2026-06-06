const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      required: true,
      enum: [
        'task_assigned',
        'task_mentioned',
        'task_commented',
        'task_due_soon',
        'board_invite',
        'task_moved',
        'checklist_completed',
      ],
    },
    board: { type: Schema.Types.ObjectId, ref: 'Board', default: null },
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
