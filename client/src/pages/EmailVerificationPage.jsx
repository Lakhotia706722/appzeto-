import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        await api.post(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage('Your email has been verified. You can now sign in.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification failed. The link may have expired.');
      }
    };
    verify();
  }, [token]);

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

        {status === 'verifying' && (
          <div className="card p-8 space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--text-muted)]">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="card p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto">
              <span className="text-[var(--success)] text-2xl">✓</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Email verified</h2>
            <p className="text-sm text-[var(--text-muted)]">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-2 px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-btn hover:bg-[var(--accent-hover)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="card p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto">
              <span className="text-[var(--danger)] text-2xl">✕</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Verification failed</h2>
            <p className="text-sm text-[var(--text-muted)]">{message}</p>
            <Link
              to="/register"
              className="inline-block mt-2 text-sm text-[var(--accent)] hover:underline"
            >
              Create a new account
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;
