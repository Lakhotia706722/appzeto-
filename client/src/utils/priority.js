export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' },
  high:   { label: 'High',   color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  low:    { label: 'Low',    color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)'  },
  none:   { label: 'None',   color: '#71717a', bgColor: 'rgba(113,113,122,0.12)' },
};

export const getPriorityConfig = (priority) =>
  PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
