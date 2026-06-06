import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => (
  <div className={`flex flex-col gap-1 ${containerClassName}`}>
    {label && (
      <label className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm rounded-btn
          bg-[var(--bg-tertiary)] border border-[var(--border)]
          text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pl-9' : ''}
          ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
