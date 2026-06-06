import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Move, Trash2, Archive, UserPlus, UserMinus,
  MessageSquare, Paperclip, CheckSquare, Settings, Flag,
} from 'lucide-react';
import { useBoardActivity } from '../../hooks/useBoards';
import Avatar from '../ui/Avatar';
import { relativeTime, formatDateShort } from '../../utils/dates';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';

const ACTION_ICONS = {
  task_created: <Plus size={12} />,
  task_updated: <Settings size={12} />,
  task_moved: <Move size={12} />,
  task_deleted: <Trash2 size={12} />,
  task_archived: <Archive size={12} />,
  task_assigned: <UserPlus size={12} />,
  task_unassigned: <UserMinus size={12} />,
  task_priority_changed: <Flag size={12} />,
  task_completed: <CheckSquare size={12} />,
  comment_added: <MessageSquare size={12} />,
  comment_edited: <MessageSquare size={12} />,
  attachment_added: <Paperclip size={12} />,
  member_invited: <UserPlus size={12} />,
  member_removed: <UserMinus size={12} />,
  board_created: <Plus size={12} />,
  board_updated: <Settings size={12} />,
  checklist_item_completed: <CheckSquare size={12} />,
};

const ACTION_LABELS = {
  task_created: 'created task',
  task_updated: 'updated task',
  task_moved: 'moved task',
  task_deleted: 'deleted a task',
  task_archived: 'archived task',
  task_assigned: 'assigned task',
  task_unassigned: 'unassigned task',
  task_priority_changed: 'changed priority',
  task_completed: 'completed task',
  task_due_date_changed: 'changed due date',
  comment_added: 'commented on',
  comment_edited: 'edited comment on',
  comment_deleted: 'deleted comment on',
  attachment_added: 'added attachment to',
  attachment_removed: 'removed attachment from',
  member_invited: 'invited member',
  member_removed: 'removed member',
  member_role_changed: 'changed member role',
  board_created: 'created board',
  board_updated: 'updated board',
  board_archived: 'archived board',
  checklist_item_added: 'added checklist item to',
  checklist_item_completed: 'completed checklist item on',
};

const groupByDate = (activities) => {
  const groups = {};
  activities.forEach((a) => {
    const date = formatDateShort(a.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(a);
  });
  return groups;
};

const ActivityTimeline = ({ boardId }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBoardActivity(boardId, page);

  const activities = data?.activities || [];
  const grouped = groupByDate(activities);
  const hasMore = data ? page < data.pages : false;

  if (isLoading && page === 1) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton height="h-6" className="w-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton height="h-3" className="w-48" />
              <Skeleton height="h-3" className="w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">
            {date}
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="space-y-3">
              {items.map((activity, i) => (
                <ActivityItem key={activity._id} activity={activity} index={i} />
              ))}
            </div>
          </div>
        </div>
      ))}

      {activities.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">No activity yet</p>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            loading={isLoading}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};

const ActivityItem = ({ activity, index }) => {
  const icon = ACTION_ICONS[activity.action] || <Settings size={12} />;
  const verb = ACTION_LABELS[activity.action] || activity.action;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 pl-1"
    >
      {/* Icon dot */}
      <div
        className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)]
          flex items-center justify-center shrink-0 z-10 text-[var(--text-muted)]"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Avatar user={activity.actor} size="xs" />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {activity.actor?.name || 'Someone'}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">{verb}</span>
          {activity.task?.title && (
            <span className="text-xs font-medium text-[var(--accent)] truncate max-w-[160px]">
              "{activity.task.title}"
            </span>
          )}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {relativeTime(activity.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};

export default ActivityTimeline;
