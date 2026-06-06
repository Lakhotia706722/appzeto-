const mongoose = require('mongoose');
const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'board_created',
        'board_updated',
        'board_archived',
        'member_invited',
        'member_removed',
        'member_role_changed',
        'task_created',
        'task_updated',
        'task_moved',
        'task_deleted',
        'task_archived',
        'task_assigned',
        'task_unassigned',
        'task_priority_changed',
        'task_due_date_changed',
        'task_completed',
        'comment_added',
        'comment_edited',
        'comment_deleted',
        'attachment_added',
        'attachment_removed',
        'checklist_item_added',
        'checklist_item_completed',
      ],
    },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index for paginated board activity feed
activitySchema.index({ board: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
