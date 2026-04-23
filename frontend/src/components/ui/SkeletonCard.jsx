const SkeletonCard = ({ className = '', lines = 3 }) => (
  <div className={`animate-pulse bg-bg-card rounded-lg p-4 ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 bg-gray-200 rounded mb-2 w-full" />
    ))}
  </div>
);

export default SkeletonCard;
