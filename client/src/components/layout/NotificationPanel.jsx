import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import { relativeTime } from '../../utils/dates';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

const NOTIFICATION_ICONS = {
  task_assigned: '📋',
  task_mentioned: '💬',
  task_commented: '💬',
  task_due_soon: '⏰',
  board_invite: '✉️',
  task_moved: '🔄',
  checklist_completed: '✅',
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { data, isLoading } = useNotifications(1);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification._id);
    }
    if (notification.board && notification.task) {
      navigate(`/boards/${notification.board._id || notification.board}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-80 z-50
            bg-[var(--bg-secondary)] border border-[var(--border)] rounded-card shadow-2xl
            overflow-hidden"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-[var(--accent)] hover:underline px-1"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Close notifications"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton height="h-7" className="w-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton height="h-3" />
                      <Skeleton height="h-3" className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell size={24} className="text-[var(--text-muted)] mb-2" />
                <p className="text-sm text-[var(--text-muted)]">You're all caught up</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-2">
              <button
                onClick={() => { navigate('/notifications'); onClose(); }}
                className="w-full text-xs text-[var(--accent)] hover:underline text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NotificationItem = ({ notification, onClick }) => {
  const emoji = NOTIFICATION_ICONS[notification.type] || '🔔';

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
        hover:bg-[var(--bg-hover)]
        ${!notification.isRead ? 'bg-[var(--accent-subtle)]' : ''}
      `}
      aria-label={notification.message}
    >
      <div className="relative shrink-0">
        <Avatar user={notification.actor} size="sm" />
        <span
          className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none"
          aria-hidden="true"
        >
          {emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-primary)] leading-snug">
          <span className="font-medium">{notification.actor?.name || 'Someone'}</span>{' '}
          {notification.message}
          {notification.task?.title && (
            <span className="text-[var(--accent)]"> "{notification.task.title}"</span>
          )}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div
          className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1"
          aria-label="Unread"
        />
      )}
    </button>
  );
};

export default NotificationPanel;
