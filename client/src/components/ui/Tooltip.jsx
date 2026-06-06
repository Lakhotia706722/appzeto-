import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ children, content, placement = 'top', delay = 300 }) => {
  const [visible, setVisible] = useState(false);
  let timer;

  const show = () => { timer = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timer); setVisible(false); };

  const placements = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && content && (
          <motion.div
            role="tooltip"
            className={`absolute z-50 pointer-events-none ${placements[placement]}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs px-2 py-1 rounded-md border border-[var(--border)] shadow-lg whitespace-nowrap">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default Tooltip;
