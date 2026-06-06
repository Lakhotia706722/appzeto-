import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-btn bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset password</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {sent ? (
          <div className="card p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto">
              <span className="text-[var(--success)] text-xl">✓</span>
            </div>
            <p className="text-sm text-[var(--text-primary)] font-medium">Check your email</p>
            <p className="text-xs text-[var(--text-muted)]">
              If that email exists, we sent a reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="block text-sm text-[var(--accent)] hover:underline mt-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
