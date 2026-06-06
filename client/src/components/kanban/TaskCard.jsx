import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { MessageSquare, Paperclip, CheckSquare, GripVertical } from 'lucide-react';
import { AvatarGroup } from '../ui/Avatar';
import Badge from '../ui/Badge';
import useUIStore from '../../store/useUIStore';
import { formatDateShort, isOverdue, getDueDateBadgeStyle } from '../../utils/dates';
import { getPriorityConfig } from '../../utils/priority';

const TaskCard = ({ task, boardId, isDragging = false }) => {
  const { setModal } = useUIStore();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const dueBadge = getDueDateBadgeStyle(task.dueDate, task.status);
  const checklistDone = task.checklist?.filter((c) => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;
  const checklistPct = checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        card p-3 cursor-pointer group select-none
        hover:border-[var(--accent)] transition-all duration-150
        ${isDragging ? 'shadow-2xl ring-2 ring-[var(--accent)] rotate-1' : ''}
      `}
      onClick={() => setModal('task-detail', task._id)}
      role="button"
      aria-label={`Open task: ${task.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') setModal('task-detail', task._id); }}
    >
      {/* Drag handle + priority dot */}
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={12} />
        </div>
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ background: priorityConfig.color }}
          title={`Priority: ${priorityConfig.label}`}
        />
        <p className="text-sm text-[var(--text-primary)] font-medium leading-snug line-clamp-2 flex-1">
          {task.title}
        </p>
      </div>

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-6">
          {task.labels.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-badge bg-[var(--accent-subtle)] text-[var(--accent)]"
            >
              {labelId}
            </span>
          ))}
        </div>
      )}

      {/* Checklist progress */}
      {checklistTotal > 0 && (
        <div className="mt-2 ml-6">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CheckSquare size={11} />
            <span>{checklistDone}/{checklistTotal}</span>
          </div>
          <div className="mt-1 h-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
              style={{ width: `${checklistPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: due date + assignees + counts */}
      <div className="flex items-center justify-between mt-2.5 ml-6">
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <Badge
              variant={dueBadge || 'default'}
              className="text-[10px]"
            >
              {formatDateShort(task.dueDate)}
            </Badge>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
              <Paperclip size={10} />
              {task.attachments.length}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
              <MessageSquare size={10} />
              {task.commentCount}
            </span>
          )}
        </div>
        <AvatarGroup users={task.assignedTo || []} max={3} size="xs" />
      </div>
    </motion.div>
  );
};

export default TaskCard;
