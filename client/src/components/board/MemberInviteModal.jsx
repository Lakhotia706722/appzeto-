import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Crown, Shield, User, Eye, Trash2, Copy, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import { boardsApi } from '../../api/boards';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    icon: <Shield size={12} />,
    description: 'Can manage board settings, members, and all tasks',
  },
  {
    value: 'member',
    label: 'Member',
    icon: <User size={12} />,
    description: 'Can create and edit tasks',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: <Eye size={12} />,
    description: 'Can view the board and tasks, but cannot edit',
  },
];

const ROLE_ICONS = {
  owner: <Crown size={12} className="text-yellow-400" />,
  admin: <Shield size={12} className="text-[var(--accent)]" />,
  member: <User size={12} className="text-[var(--text-muted)]" />,
  viewer: <Eye size={12} className="text-[var(--text-muted)]" />,
};

const MemberInviteModal = ({ isOpen, onClose, board, currentUserRole }) => {
  const queryClient = useQueryClient();
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  const onInvite = async (data) => {
    setInviting(true);
    try {
      await boardsApi.inviteMember(board._id, { email: data.email, role: inviteRole });
      toast.success(`Invitation sent to ${data.email}`);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the board?')) return;
    try {
      await boardsApi.removeMember(board._id, userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(board._id) });
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await boardsApi.updateMember(board._id, userId, role);
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(board._id) });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/boards/${board._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Members" size="md">
      <div className="p-6 space-y-6">
        {/* Invite by email */}
        {canManage && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Invite people</h3>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-3">
              <Input
                label="Email address"
                type="email"
                placeholder="colleague@company.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />

              {/* Role selector */}
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Role</p>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <Tooltip key={role.value} content={role.description}>
                      <button
                        type="button"
                        onClick={() => setInviteRole(role.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-btn border transition-all ${
                          inviteRole === role.value
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]'
                            : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                        }`}
                        aria-pressed={inviteRole === role.value}
                      >
                        {role.icon}
                        {role.label}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" loading={inviting} className="flex-1">
                  Send invitation
                </Button>
                <Button type="button" variant="secondary" onClick={handleCopyLink} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Current members */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Current members ({board?.members?.length || 0})
          </h3>
          <div className="space-y-2">
            {board?.members?.map((membership) => {
              const member = membership.user;
              if (!member) return null;
              const memberId = member._id?.toString();

              return (
                <div
                  key={memberId}
                  className="flex items-center gap-3 p-2 rounded-btn hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <Avatar user={member} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{member.email}</p>
                  </div>

                  {/* Role badge */}
                  <div className="flex items-center gap-1">
                    {canManage && membership.role !== 'owner' ? (
                      <select
                        value={membership.role}
                        onChange={(e) => handleRoleChange(memberId, e.target.value)}
                        className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-badge
                          px-2 py-0.5 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        aria-label={`Change role for ${member.name}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-badge">
                        {ROLE_ICONS[membership.role]}
                        <span className="capitalize">{membership.role}</span>
                      </span>
                    )}

                    {/* Remove button */}
                    {canManage && membership.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors rounded-md hover:bg-[var(--bg-hover)]"
                        aria-label={`Remove ${member.name} from board`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MemberInviteModal;
