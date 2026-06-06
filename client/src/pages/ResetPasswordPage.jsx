import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Reset failed. The link may have expired.');
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">New password</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4" noValidate>
          <Input
            label="New password"
            type="password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              pattern: { value: /[A-Z]/, message: 'Must contain an uppercase letter' },
            })}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat new password"
            error={errors.confirm?.message}
            {...register('confirm', {
              validate: (val) => val === watch('password') || 'Passwords do not match',
            })}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Reset password
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Back to sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
