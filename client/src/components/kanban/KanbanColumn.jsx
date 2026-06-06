import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import TaskCard from './TaskCard';
import Button from '../ui/Button';
import useUIStore from '../../store/useUIStore';
import { useCreateTask } from '../../hooks/useTasks';
import toast from 'react-hot-toast';

const VIRTUAL_THRESHOLD = 50;

const KanbanColumn = ({ column, tasks = [], boardId }) => {
  const { setModal, filters } = useUIStore();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const createTask = useCreateTask(boardId);
  const parentRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = tasks.map((t) => t._id);

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: quickTitle.trim(), columnId: column.id });
      setQuickTitle('');
      setShowQuickCreate(false);
    } catch {
      toast.error('Failed to create task');
    }
  };

  // Virtual scrolling for large columns
  const useVirtual = tasks.length > VIRTUAL_THRESHOLD;
  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 112,
    overscan: 5,
  });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-1 pb-2 mb-2"
        style={{ borderBottom: `2px solid ${column.color}` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: column.color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">
          {column.title}
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-medium px-1.5 py-0.5 rounded-badge bg-[var(--bg-tertiary)]">
          {tasks.length}
        </span>
        <button
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          aria-label={`Column options for ${column.title}`}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Tasks droppable area */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={(el) => { setNodeRef(el); if (useVirtual) parentRef.current = el; }}
          className={`
            flex-1 min-h-[60px] rounded-card p-1 space-y-2 transition-colors duration-150 overflow-y-auto
            ${isOver ? 'bg-[var(--accent-subtle)] ring-2 ring-[var(--accent)]' : 'bg-transparent'}
          `}
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          {tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-16 text-xs text-[var(--text-muted)] border-2 border-dashed border-[var(--border)] rounded-card">
              Drop tasks here
            </div>
          )}

          {useVirtual ? (
            <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: 8,
                  }}
                >
                  <TaskCard task={tasks[virtualRow.index]} boardId={boardId} />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} boardId={boardId} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </SortableContext>

      {/* Quick create */}
      <AnimatePresence>
        {showQuickCreate ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <textarea
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Task title..."
              autoFocus
              className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-btn
                text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickCreate(); }
                if (e.key === 'Escape') { setShowQuickCreate(false); setQuickTitle(''); }
              }}
            />
            <div className="flex gap-2 mt-1">
              <Button size="xs" onClick={handleQuickCreate} loading={createTask.isPending}>
                Add
              </Button>
              <Button size="xs" variant="ghost" onClick={() => { setShowQuickCreate(false); setQuickTitle(''); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowQuickCreate(true)}
            className="mt-2 flex items-center gap-1.5 px-2 py-1.5 text-sm text-[var(--text-muted)]
              hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-btn transition-colors w-full"
          >
            <Plus size={14} />
            Add task
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanColumn;
