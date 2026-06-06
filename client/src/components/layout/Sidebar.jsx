import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Bell, Settings, Plus,
  Star, Moon, Sun, Monitor, LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useUIStore from '../../store/useUIStore';
import { useBoards } from '../../hooks/useBoards';
import { useUnreadCount } from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import CreateBoardModal from '../board/CreateBoardModal';
import { applyTheme } from '../../utils/theme';

const ThemeButton = ({ theme, current, label, icon: Icon, onSelect }) => (
  <button
    onClick={() => onSelect(theme)}
    className={`p-1.5 rounded-md transition-colors ${
      current === theme
        ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
    }`}
    title={label}
    aria-label={`Switch to ${label} theme`}
    aria-pressed={current === theme}
  >
    <Icon size={14} />
  </button>
);

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const { data: boards = [] } = useBoards();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [theme, setThemeState] = useState(
    () => user?.preferences?.theme || localStorage.getItem('taskflow-theme') || 'system'
  );
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const handleThemeChange = (t) => {
    setThemeState(t);
    localStorage.setItem('taskflow-theme', t);
    applyTheme(t);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userId = user?._id?.toString();
  const starredBoards = boards.filter((b) =>
    b.isStarred?.some((id) => id.toString() === userId)
  );
  const otherBoards = boards.filter(
    (b) => !b.isStarred?.some((id) => id.toString() === userId)
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-0 top-0 bottom-0 w-64 z-30 flex flex-col
              bg-[var(--bg-secondary)] border-r border-[var(--border)]"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
              <div className="w-8 h-8 rounded-btn bg-[var(--accent)] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">TaskFlow Pro</span>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
              <Avatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" aria-label="Main navigation">
              <NavItem
                to="/boards"
                icon={<LayoutDashboard size={15} />}
                label="My Boards"
                active={location.pathname === '/boards'}
              />
              <NavItem
                to="/notifications"
                icon={<Bell size={15} />}
                label="Notifications"
                badge={unreadCount > 0 ? unreadCount : null}
                active={location.pathname === '/notifications'}
              />
              <NavItem
                to="/settings"
                icon={<Settings size={15} />}
                label="Settings"
                active={location.pathname === '/settings'}
              />

              {/* Starred boards */}
              {starredBoards.length > 0 && (
                <section className="mt-4">
                  <p className="px-2 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Starred
                  </p>
                  {starredBoards.map((b) => (
                    <BoardNavItem
                      key={b._id}
                      board={b}
                      active={location.pathname.startsWith(`/boards/${b._id}`)}
                    />
                  ))}
                </section>
              )}

              {/* All boards */}
              {otherBoards.length > 0 && (
                <section className="mt-4">
                  <p className="px-2 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Boards
                  </p>
                  {otherBoards.map((b) => (
                    <BoardNavItem
                      key={b._id}
                      board={b}
                      active={location.pathname.startsWith(`/boards/${b._id}`)}
                    />
                  ))}
                </section>
              )}
            </nav>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-2 py-3 space-y-1">
              {/* Create board */}
              <button
                onClick={() => setShowCreateBoard(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--text-secondary)]
                  hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-btn transition-colors"
              >
                <Plus size={14} />
                New board
              </button>

              {/* Theme toggles */}
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-[var(--text-muted)]">Theme</span>
                <div className="flex items-center gap-0.5">
                  <ThemeButton theme="light" current={theme} label="Light" icon={Sun} onSelect={handleThemeChange} />
                  <ThemeButton theme="dark" current={theme} label="Dark" icon={Moon} onSelect={handleThemeChange} />
                  <ThemeButton theme="system" current={theme} label="System" icon={Monitor} onSelect={handleThemeChange} />
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--text-muted)]
                  hover:text-[var(--danger)] hover:bg-[var(--bg-hover)] rounded-btn transition-colors"
                aria-label="Log out"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Create board modal */}
      <CreateBoardModal
        isOpen={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
      />
    </>
  );
};

const NavItem = ({ to, icon, label, badge, active }) => (
  <Link
    to={to}
    className={`
      flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-btn transition-colors
      ${active
        ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-medium'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }
    `}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    <span className="flex-1">{label}</span>
    {badge != null && (
      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </Link>
);

const BoardNavItem = ({ board, active }) => (
  <Link
    to={`/boards/${board._id}`}
    className={`
      flex items-center gap-2 px-2 py-1.5 text-sm rounded-btn transition-colors
      ${active
        ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-medium'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }
    `}
    aria-current={active ? 'page' : undefined}
  >
    <span
      className="w-2.5 h-2.5 rounded-sm shrink-0"
      style={{ background: board.coverColor || '#6366f1' }}
      aria-hidden="true"
    />
    <span className="flex-1 truncate">{board.title}</span>
  </Link>
);

export default Sidebar;
