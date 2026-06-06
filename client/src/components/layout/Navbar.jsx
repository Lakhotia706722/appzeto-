import { useState } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import { useUnreadCount } from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import NotificationPanel from './NotificationPanel';

const Navbar = ({ title, right }) => {
  const { toggleSidebar, setModal } = useUIStore();
  const { user } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0 relative">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-xs">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Right slot (custom per page) */}
      {right && <div className="flex items-center gap-2">{right}</div>}

      {/* Global search trigger */}
      <button
        onClick={() => setModal('command-palette')}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-muted)]
          bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-btn
          hover:border-[var(--accent)] transition-colors"
        aria-label="Open command palette (Ctrl+K)"
      >
        <Search size={13} />
        <span className="hidden sm:block">Search</span>
        <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] bg-[var(--bg-hover)] rounded font-mono ml-1">
          ⌘K
        </kbd>
      </button>

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={notifOpen}
          aria-haspopup="dialog"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute top-0.5 right-0.5 w-[14px] h-[14px] rounded-full bg-[var(--accent)]
                text-white text-[8px] font-bold flex items-center justify-center"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>

      {/* User avatar */}
      <Avatar user={user} size="sm" />
    </header>
  );
};

export default Navbar;
