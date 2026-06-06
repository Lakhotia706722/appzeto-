import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useBoardAnalytics } from '../../hooks/useBoards';
import Skeleton from '../ui/Skeleton';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
const STATUS_COLORS = { todo: '#71717a', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#22c55e' };
const PRIORITY_COLORS = { none: '#71717a', low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

const StatCard = ({ label, value, sub, color = 'var(--accent)' }) => (
  <div className="card p-4">
    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
  </div>
);

const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-muted)' },
  itemStyle: { color: 'var(--text-primary)' },
};

const AnalyticsDashboard = ({ boardId, range, setRange }) => {
  const { data, isLoading } = useBoardAnalytics(boardId, range);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton height="h-3" className="w-20 mb-2" />
            <Skeleton height="h-8" className="w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const statusData = Object.entries(data.statusCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
    value,
    fill: STATUS_COLORS[key],
  }));

  const priorityData = Object.entries(data.priorityCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    fill: PRIORITY_COLORS[key],
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${
              range === r
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            Last {r}d
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={data.totalTasks} />
        <StatCard label="Completed" value={data.completedTasks} color="var(--success)" />
        <StatCard label="Overdue" value={data.overdueCount} color="var(--danger)" />
        <StatCard label="Completion Rate" value={`${data.completionRate}%`} color="var(--accent)"
          sub={`${data.completedTasks} of ${data.totalTasks} tasks`} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion trend */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#completionGrad)" strokeWidth={2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} width={80} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Member contribution */}
        {Object.keys(data.memberContribution).length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Member Contribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                layout="vertical"
                data={Object.entries(data.memberContribution).map(([id, count]) => ({ name: id.slice(-6), count }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} width={60} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Tasks" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
