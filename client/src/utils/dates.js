import { formatDistanceToNow, format, isToday, isYesterday, isPast } from 'date-fns';

export const relativeTime = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatDate = (date, fmt = 'MMM d, yyyy') =>
  format(new Date(date), fmt);

export const formatDateShort = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

export const isOverdue = (date) => date && isPast(new Date(date));

export const getDueDateBadgeStyle = (dueDate, status) => {
  if (!dueDate) return null;
  if (status === 'done') return 'success';
  if (isOverdue(dueDate)) return 'danger';
  const daysUntil = (new Date(dueDate) - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 1) return 'warning';
  return 'info';
};
