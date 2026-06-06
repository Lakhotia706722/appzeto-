import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, MoreHorizontal, Archive, Trash2, Users } from 'lucide-react';
import { useBoards, useCreateBoard, useDeleteBoard, useStarBoard } from '../hooks/useBoards';
import { boardsApi } from '../api/boards';
import Navbar from '../components/layout/Navbar';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { BoardCardSkeleton } from '../components/ui/Skeleton';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import { relativeTime } from '../utils/dates';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const COVER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#f97316',
];

const BoardsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: boards = [], isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COVER_COLORS[0]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onCreateBoard = async (data) => {
    try {
      const board = await createBoard.mutateAsync({ ...data, coverColor: selectedColor });
      setShowCreate(false);
      reset();
      navigate(`/boards/${board._id}`);
    } catch {}
  };

  const handleArchive = async (boardId, e) => {
    e.stopPropagation();
    try {
      await boardsApi.archive(boardId);
      toast.success('Board archived');
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      <Navbar title="My Boards" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Boards</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
            </div>
            <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
              New board
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <BoardCardSkeleton key={i} />)}
            </div>
          ) : boards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-card bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">No boards yet</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Create your first board to get started</p>
              <Button onClick={() => setShowCreate(true)}>Create board</Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board, i) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  userId={user?._id}
                  index={i}
                  onClick={() => navigate(`/boards/${board._id}`)}
                  onArchive={(e) => handleArchive(board._id, e)}
                  onDelete={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Delete this board? This cannot be undone.')) return;
                    await deleteBoard.mutateAsync(board._id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create board modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create board" size="sm">
        <form onSubmit={handleSubmit(onCreateBoard)} className="p-6 space-y-4">
          <Input
            label="Board name"
            placeholder="e.g. Product Roadmap"
            error={errors.title?.message}
            {...register('title', { required: 'Board name is required' })}
          />
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Cover color</label>
            <div className="flex gap-2 flex-wrap">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-btn transition-transform hover:scale-110 ${selectedColor === c ? 'ring-2 ring-offset-2 ring-[var(--text-primary)] ring-offset-[var(--bg-secondary)]' : ''}`}
                  style={{ background: c }}
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={selectedColor === c}
                />
              ))}
            </div>
          </div>
          <Input
            label="Description (optional)"
            placeholder="What is this board for?"
            {...register('description')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createBoard.isPending}>Create board</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const BoardCard = ({ board, userId, index, onClick, onArchive, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const starBoard = useStarBoard(board._id);
  const isStarred = board.isStarred?.some((id) => id.toString() === userId?.toString());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card overflow-hidden cursor-pointer group hover:ring-1 hover:ring-[var(--accent)] transition-all duration-150"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      aria-label={`Open board ${board.title}`}
    >
      {/* Cover */}
      <div
        className="h-16 flex-shrink-0"
        style={{ background: board.coverImage ? `url(${board.coverImage}) center/cover` : board.coverColor }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate flex-1">{board.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {/* Star */}
            <button
              onClick={(e) => { e.stopPropagation(); starBoard.mutate(); }}
              className={`p-1 rounded-md transition-colors ${isStarred ? 'text-yellow-400' : 'text-[var(--text-muted)] hover:text-yellow-400'}`}
              aria-label={isStarred ? 'Unstar board' : 'Star board'}
            >
              <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Board options"
              >
                <MoreHorizontal size={13} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                    <motion.div
                      className="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-card shadow-xl py-1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      <MenuBtn icon={<Archive size={12} />} label="Archive" onClick={onArchive} />
                      <MenuBtn icon={<Trash2 size={12} />} label="Delete" onClick={onDelete} danger />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <AvatarGroup users={board.members?.map((m) => m.user) || []} max={4} size="xs" />
          <span className="text-[10px] text-[var(--text-muted)]">
            {board.updatedAt ? relativeTime(board.updatedAt) : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const MenuBtn = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--bg-hover)] transition-colors ${
      danger ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default BoardsListPage;
