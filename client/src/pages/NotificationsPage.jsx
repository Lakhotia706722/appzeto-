import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { relativeTime } from '../utils/dates';

const NOTIFICATION_ICONS = {
  task_assigned: '📋',
  task_mentioned: '💬',
  task_commented: '💬',
  task_due_soon: '⏰',
  board_invite: '✉️',
  task_moved: '🔄',
  checklist_completed: '✅',
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications(1);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClick = (notification) => {
    if (!notification.isRead) markRead.mutate(notification._id);
    if (notification.board && notification.task) {
      navigate(`/boards/${notification.board._id || notification.board}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      <Navbar title="Notifications" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-[var(--text-muted)]">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()}>
                Mark all read
              </Button>
            )}
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-[var(--border)]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-4">
                    <Skeleton height="h-8" className="w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton height="h-3" />
                      <Skeleton height="h-3" className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell size={32} className="text-[var(--text-muted)] mb-3" />
                <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">
                  All caught up
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  No notifications yet. They'll show up here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleClick(notification)}
                    className={`
                      w-full flex items-start gap-3 p-4 text-left transition-colors
                      hover:bg-[var(--bg-hover)]
                      ${!notification.isRead ? 'bg-[var(--accent-subtle)]' : ''}
                    `}
                    aria-label={notification.message}
                  >
                    <div className="relative shrink-0">
                      <Avatar user={notification.actor} size="md" />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 text-sm leading-none"
                        aria-hidden="true"
                      >
                        {NOTIFICATION_ICONS[notification.type] || '🔔'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] leading-snug">
                        <span className="font-medium">{notification.actor?.name || 'Someone'}</span>{' '}
                        {notification.message}
                      </p>
                      {notification.task?.title && (
                        <p className="text-xs text-[var(--accent)] mt-0.5 truncate">
                          "{notification.task.title}"
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {relativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0 mt-1"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
