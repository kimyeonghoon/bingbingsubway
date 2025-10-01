// Skeleton loading components for better UX

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 animate-pulse">
      <div className="skeleton h-6 w-3/4 mb-4 bg-gray-200"></div>
      <div className="skeleton h-4 w-full mb-2 bg-gray-200"></div>
      <div className="skeleton h-4 w-5/6 bg-gray-200"></div>
    </div>
  );
}

export function StationCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-6 w-32 bg-gray-200"></div>
        <div className="skeleton h-8 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="skeleton h-4 w-24 mb-3 bg-gray-200"></div>
      <div className="skeleton h-10 w-full bg-gray-200 rounded-lg"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="skeleton h-6 w-32 bg-gray-200"></div>
      </div>
      <div className="skeleton h-10 w-24 bg-gray-200"></div>
    </div>
  );
}

export function AchievementSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="skeleton w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="skeleton h-6 w-48 mb-2 bg-gray-200"></div>
          <div className="skeleton h-4 w-64 bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="skeleton h-5 w-32 mb-2 bg-gray-200"></div>
          <div className="skeleton h-4 w-48 bg-gray-200"></div>
        </div>
        <div className="skeleton h-8 w-16 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="bg-gray-100 p-4 flex gap-4">
          <div className="skeleton h-5 w-1/4 bg-gray-200"></div>
          <div className="skeleton h-5 w-1/4 bg-gray-200"></div>
          <div className="skeleton h-5 w-1/4 bg-gray-200"></div>
          <div className="skeleton h-5 w-1/4 bg-gray-200"></div>
        </div>
        {/* Table rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 border-t border-gray-100 flex gap-4">
            <div className="skeleton h-4 w-1/4 bg-gray-200"></div>
            <div className="skeleton h-4 w-1/4 bg-gray-200"></div>
            <div className="skeleton h-4 w-1/4 bg-gray-200"></div>
            <div className="skeleton h-4 w-1/4 bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="skeleton h-10 w-64 mb-8 bg-gray-200 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
