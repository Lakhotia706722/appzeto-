import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '' },
  });

  const onSave = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/auth/me', data);
      updateUser(res.data.data.user);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.data.user);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/auth/me/avatar');
      updateUser({ avatar: null, avatarPublicId: null });
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      <Navbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Profile section */}
          <section className="card p-6">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Profile</h2>
            <div className="flex items-center gap-4 mb-6">
              <Avatar user={user} size="xl" />
              <div>
                <label className="text-sm text-[var(--accent)] cursor-pointer hover:underline">
                  Change photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
                {user?.avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="block text-xs text-[var(--text-muted)] hover:text-[var(--danger)] mt-1 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <Input
                label="Display name"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input label="Email" value={user?.email || ''} disabled />
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>Save changes</Button>
              </div>
            </form>
          </section>

          {/* Email verification status */}
          {!user?.isEmailVerified && (
            <div className="card p-4 border-[var(--warning)] bg-yellow-500/5">
              <p className="text-sm text-yellow-400">
                Your email is not verified. Check your inbox for a verification link.
              </p>
            </div>
          )}

          {/* Notification preferences */}
          <section className="card p-6">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Push notifications</p>
                  <p className="text-xs text-[var(--text-muted)]">In-app alerts for tasks and mentions</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={user?.preferences?.notifications}
                  className="accent-[var(--accent)] w-4 h-4"
                  onChange={async (e) => {
                    await api.put('/auth/me', { preferences: { notifications: e.target.checked } });
                    updateUser({ preferences: { ...user?.preferences, notifications: e.target.checked } });
                  }}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Email digest</p>
                  <p className="text-xs text-[var(--text-muted)]">Receive periodic email summaries</p>
                </div>
                <select
                  defaultValue={user?.preferences?.emailDigest || 'weekly'}
                  className="text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-btn px-2 py-1 text-[var(--text-primary)] focus:outline-none"
                  onChange={async (e) => {
                    await api.put('/auth/me', { preferences: { emailDigest: e.target.value } });
                    updateUser({ preferences: { ...user?.preferences, emailDigest: e.target.value } });
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
