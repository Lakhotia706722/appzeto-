const variants = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  danger: 'bg-red-500/10 text-red-400',
  info: 'bg-blue-500/10 text-blue-400',
  accent: 'bg-[var(--accent-subtle)] text-[var(--accent)]',
};

const Badge = ({ children, variant = 'default', className = '', dot = false }) => (
  <span
    className={`
      inline-flex items-center gap-1.5 px-2 py-0.5
      text-xs font-medium rounded-badge whitespace-nowrap
      ${variants[variant]} ${className}
    `}
  >
    {dot && (
      <span
        className="w-1.5 h-1.5 rounded-full bg-current shrink-0"
        aria-hidden="true"
      />
    )}
    {children}
  </span>
);

export default Badge;
