import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <p className="text-7xl font-bold text-[var(--accent)] mb-4">404</p>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Page not found</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">The page you're looking for doesn't exist.</p>
      <Link
        to="/boards"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-btn hover:bg-[var(--accent-hover)] transition-colors"
      >
        Go to boards
      </Link>
    </motion.div>
  </div>
);

export default NotFoundPage;
