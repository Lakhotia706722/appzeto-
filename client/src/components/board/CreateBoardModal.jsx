import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useCreateBoard } from '../../hooks/useBoards';

const COVER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#f97316',
  '#14b8a6', '#84cc16',
];

const CreateBoardModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const createBoard = useCreateBoard();
  const [selectedColor, setSelectedColor] = useState(COVER_COLORS[0]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const board = await createBoard.mutateAsync({
        title: data.title,
        description: data.description || '',
        coverColor: selectedColor,
      });
      reset();
      onClose();
      navigate(`/boards/${board._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create board');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedColor(COVER_COLORS[0]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create board" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {/* Color preview header */}
        <div
          className="h-20 rounded-card transition-colors duration-200"
          style={{ background: selectedColor }}
          aria-hidden="true"
        />

        <Input
          label="Board name"
          placeholder="e.g. Product Roadmap"
          error={errors.title?.message}
          autoFocus
          {...register('title', { required: 'Board name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
        />

        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
            Cover color
          </label>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-btn transition-all hover:scale-110 focus-visible:outline-2 ${
                  selectedColor === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)] scale-110'
                    : ''
                }`}
                style={{ background: color }}
                aria-label={`Select color ${color}`}
                aria-pressed={selectedColor === color}
              />
            ))}
          </div>
        </div>

        <Input
          label="Description"
          placeholder="What is this board for? (optional)"
          {...register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createBoard.isPending}>
            Create board
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBoardModal;
