/**
 * User avatar — shows image if available, falls back to initials.
 */
const colors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#f97316',
];

const getColor = (name = '') =>
  colors[name.charCodeAt(0) % colors.length];

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const sizeMap = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-14 h-14 text-xl',
};

const Avatar = ({ user, size = 'md', className = '', onClick }) => {
  const initials = getInitials(user?.name);
  const color = getColor(user?.name);

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden select-none
        ${sizeMap[size]} ${onClick ? 'cursor-pointer' : ''} ${className}
      `}
      style={{ background: user?.avatar ? 'transparent' : color }}
      onClick={onClick}
      title={user?.name}
      aria-label={user?.name}
      role={onClick ? 'button' : 'img'}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-semibold text-white leading-none">{initials}</span>
      )}
    </div>
  );
};

/**
 * Stacked avatar group with overflow indicator.
 */
export const AvatarGroup = ({ users = [], max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <Avatar
          key={user._id || i}
          user={user}
          size={size}
          className="-ml-1.5 first:ml-0 ring-2 ring-[var(--bg-secondary)]"
        />
      ))}
      {overflow > 0 && (
        <span
          className={`
            -ml-1.5 inline-flex items-center justify-center rounded-full
            bg-[var(--bg-hover)] text-[var(--text-muted)] font-medium
            ring-2 ring-[var(--bg-secondary)] text-xs
            ${sizeMap[size]}
          `}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

export default Avatar;
