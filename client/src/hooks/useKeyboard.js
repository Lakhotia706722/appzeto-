import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';

/**
 * Global keyboard shortcuts hook. Mount once in App.jsx.
 */
export const useKeyboardShortcuts = () => {
  const { setModal, closeModal, toggleSidebar, activeModal } = useUIStore();

  useEffect(() => {
    const handler = (e) => {
      // Ignore shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        if (activeModal === 'command-palette') closeModal();
        else setModal('command-palette');
        return;
      }

      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      // N → new task (only when a board is visible, not inside another modal)
      if (e.key === 'n' && !activeModal) {
        setModal('create-task');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeModal, setModal, closeModal, toggleSidebar]);
};
