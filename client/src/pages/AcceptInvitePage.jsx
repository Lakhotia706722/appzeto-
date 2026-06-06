import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/ui/Button';

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error' | 'needs-login'
  const [boardId, setBoardId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const accept = async () => {
      if (!isAuthenticated) {
        setStatus('needs-login');
        return;
      }
      try {
        const { data } = await api.post(`/boards/accept-invite/${token}`);
        setStatus('success');
        setBoardId(data.data?.boardId);
        setMessage(data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'This invite link is invalid or has expired.');
      }
    };
    accept();
  }, [token, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm text-center"
      >
        <div className="w-12 h-12 rounded-btn bg-[var(--accent)] flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">T</span>
        </div>

        {status === 'processing' && (
          <div className="card p-8 space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--text-muted)]">Accepting invitation...</p>
          </div>
        )}

        {status === 'needs-login' && (
          <div className="card p-8 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Sign in to accept invite</h2>
            <p className="text-sm text-[var(--text-muted)]">
              You need to be signed in to accept this board invitation.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate(`/login?redirect=/accept-invite/${token}`)}>
                Sign in
              </Button>
              <Link
                to={`/register?redirect=/accept-invite/${token}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Create account
              </Link>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="card p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto">
              <span className="text-[var(--success)] text-2xl">✓</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Invite accepted</h2>
            <p className="text-sm text-[var(--text-muted)]">{message}</p>
            {boardId && (
              <Button onClick={() => navigate(`/boards/${boardId}`)}>
                Go to board
              </Button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="card p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto">
              <span className="text-[var(--danger)] text-2xl">✕</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Invite failed</h2>
            <p className="text-sm text-[var(--text-muted)]">{message}</p>
            <Link to="/boards" className="text-sm text-[var(--accent)] hover:underline">
              Go to my boards
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AcceptInvitePage;
