const Skeleton = ({ className = '', lines = 1, height = 'h-4', gap = 'gap-2' }) => {
  if (lines === 1) {
    return <div className={`skeleton ${height} rounded ${className}`} aria-hidden="true" />;
  }
  return (
    <div className={`flex flex-col ${gap}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const TaskCardSkeleton = () => (
  <div className="card p-3 space-y-2.5" aria-hidden="true">
    <Skeleton height="h-3" />
    <Skeleton height="h-3" className="w-2/3" />
    <div className="flex items-center justify-between pt-1">
      <Skeleton height="h-5" className="w-16 rounded-badge" />
      <Skeleton height="h-6" className="w-6 rounded-full" />
    </div>
  </div>
);

export const BoardCardSkeleton = () => (
  <div className="card overflow-hidden" aria-hidden="true">
    <div className="skeleton h-20" />
    <div className="p-4 space-y-2">
      <Skeleton height="h-4" />
      <Skeleton height="h-3" className="w-1/2" />
    </div>
  </div>
);

export default Skeleton;
