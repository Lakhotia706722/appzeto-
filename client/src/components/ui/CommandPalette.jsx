import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, LayoutDashboard, Plus, Settings, LogOut } from 'lucide-react';
import { useBoards } from '../../hooks/useBoards';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setModal } = useUIStore();
  const { logout } = useAuthStore();
  const { data: boards = [] } = useBoards();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Search tasks from API when query is entered
  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setSearchResults(data.data.tasks || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (action) => {
    action();
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl bg-[var(--bg-secondary)] rounded-card border border-[var(--border)] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="flex flex-col" label="Command palette">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search size={16} className="text-[var(--text-muted)] shrink-0" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search tasks, boards, or run a command..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  autoFocus
                />
                {searching && (
                  <span className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
                  No results
                </Command.Empty>

                {/* Task search results */}
                {searchResults.length > 0 && (
                  <Command.Group heading="Tasks" className="mb-2">
                    {searchResults.slice(0, 5).map((task) => (
                      <CommandItem
                        key={task._id}
                        icon={<span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                        label={task.title}
                        sub={task.board?.title}
                        onSelect={() => handleSelect(() => navigate(`/boards/${task.board?._id}`))}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Boards */}
                {boards.length > 0 && !query && (
                  <Command.Group heading="Boards" className="mb-2">
                    {boards.slice(0, 5).map((board) => (
                      <CommandItem
                        key={board._id}
                        icon={<LayoutDashboard size={13} />}
                        label={board.title}
                        onSelect={() => handleSelect(() => navigate(`/boards/${board._id}`))}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Quick actions */}
                <Command.Group heading="Actions">
                  <CommandItem
                    icon={<Plus size={13} />}
                    label="Create new board"
                    onSelect={() => handleSelect(() => setModal('create-board'))}
                  />
                  <CommandItem
                    icon={<Plus size={13} />}
                    label="Create new task"
                    onSelect={() => handleSelect(() => setModal('create-task'))}
                  />
                  <CommandItem
                    icon={<Settings size={13} />}
                    label="Open settings"
                    onSelect={() => handleSelect(() => navigate('/settings'))}
                  />
                  <CommandItem
                    icon={<LogOut size={13} />}
                    label="Log out"
                    onSelect={() => handleSelect(logout)}
                  />
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CommandItem = ({ icon, label, sub, onSelect }) => (
  <Command.Item
    onSelect={onSelect}
    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-btn cursor-pointer
      text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]
      data-[selected=true]:bg-[var(--accent-subtle)] data-[selected=true]:text-[var(--accent)]
      transition-colors"
  >
    <span className="text-[var(--text-muted)]">{icon}</span>
    <span className="flex-1">{label}</span>
    {sub && <span className="text-xs text-[var(--text-muted)]">{sub}</span>}
  </Command.Item>
);

export default CommandPalette;
