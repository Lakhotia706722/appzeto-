import { useState, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../store/useUIStore';
import { useDebounce } from '../../hooks/useDebounce';
import { PRIORITY_CONFIG } from '../../utils/priority';
import Avatar from '../ui/Avatar';

const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));

const DUE_DATE_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const FilterBar = ({ boardMembers = [], boardLabels = [] }) => {
  const { filters, setFilter, clearFilters } = useUIStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setFilter('search', debouncedSearch);
  }, [debouncedSearch]);

  const hasActiveFilters =
    filters.priority.length > 0 ||
    filters.assignee.length > 0 ||
    filters.label.length > 0 ||
    filters.dueDate ||
    filters.search;

  const toggleMultiFilter = (key, value) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter(key, updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 pr-3 py-1.5 text-sm w-52 bg-[var(--bg-secondary)] border border-[var(--border)]
              rounded-btn text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          />
        </div>

        {/* Priority filter */}
        <Dropdown
          label="Priority"
          items={PRIORITY_OPTIONS}
          selected={filters.priority}
          onToggle={(v) => toggleMultiFilter('priority', v)}
          renderItem={(item) => (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          )}
        />

        {/* Assignee filter */}
        {boardMembers.length > 0 && (
          <Dropdown
            label="Assignee"
            items={boardMembers.map((m) => ({
              value: m.user._id,
              label: m.user.name,
              user: m.user,
            }))}
            selected={filters.assignee}
            onToggle={(v) => toggleMultiFilter('assignee', v)}
            renderItem={(item) => (
              <span className="flex items-center gap-2">
                <Avatar user={item.user} size="xs" />
                {item.label}
              </span>
            )}
          />
        )}

        {/* Label filter */}
        {boardLabels.length > 0 && (
          <Dropdown
            label="Label"
            items={boardLabels.map((l) => ({ value: l.id, label: l.name, color: l.color }))}
            selected={filters.label}
            onToggle={(v) => toggleMultiFilter('label', v)}
            renderItem={(item) => (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
            )}
          />
        )}

        {/* Due date */}
        <Dropdown
          label="Due date"
          items={DUE_DATE_OPTIONS}
          selected={filters.dueDate ? [filters.dueDate] : []}
          onToggle={(v) => setFilter('dueDate', filters.dueDate === v ? null : v)}
          renderItem={(item) => <span>{item.label}</span>}
        />

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-[var(--text-muted)]
              hover:text-[var(--danger)] hover:bg-[var(--bg-hover)] rounded-btn transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <motion.div
          className="flex flex-wrap gap-1.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {filters.priority.map((p) => (
            <FilterChip key={p} label={`Priority: ${p}`} onRemove={() => toggleMultiFilter('priority', p)} />
          ))}
          {filters.assignee.map((id) => {
            const member = boardMembers.find((m) => m.user._id === id);
            return (
              <FilterChip key={id} label={`Assignee: ${member?.user?.name || id}`} onRemove={() => toggleMultiFilter('assignee', id)} />
            );
          })}
          {filters.label.map((lid) => {
            const label = boardLabels.find((l) => l.id === lid);
            return (
              <FilterChip key={lid} label={`Label: ${label?.name || lid}`} onRemove={() => toggleMultiFilter('label', lid)} />
            );
          })}
          {filters.dueDate && (
            <FilterChip
              label={`Due: ${DUE_DATE_OPTIONS.find((o) => o.value === filters.dueDate)?.label || filters.dueDate}`}
              onRemove={() => setFilter('dueDate', null)}
            />
          )}
          {filters.search && (
            <FilterChip label={`Search: "${filters.search}"`} onRemove={() => { setSearchInput(''); setFilter('search', ''); }} />
          )}
        </motion.div>
      )}
    </div>
  );
};

const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--accent-subtle)] text-[var(--accent)] rounded-badge">
    {label}
    <button onClick={onRemove} className="hover:text-[var(--danger)] transition-colors" aria-label={`Remove filter ${label}`}>
      <X size={10} />
    </button>
  </span>
);

const Dropdown = ({ label, items, selected, onToggle, renderItem }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-btn border transition-colors
          ${selected.length > 0
            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]'
            : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
          }
        `}
      >
        {label}
        {selected.length > 0 && (
          <span className="w-4 h-4 text-[10px] rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute top-full left-0 mt-1 z-20 min-w-[160px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-card shadow-xl py-1"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
            >
              {items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => { onToggle(item.value); }}
                  className={`
                    w-full text-left px-3 py-1.5 text-sm flex items-center gap-2
                    hover:bg-[var(--bg-hover)] transition-colors
                    ${selected.includes(item.value) ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}
                  `}
                >
                  <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                    selected.includes(item.value) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
                  }`}>
                    {selected.includes(item.value) && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8L2 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  {renderItem(item)}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;
