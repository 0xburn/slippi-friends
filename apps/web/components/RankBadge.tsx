import { getRankTier, getRankLabel } from '@/lib/ranks';

export function RankBadge({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
        Unranked
      </span>
    );
  }

  const tier = getRankTier(rating);
  const label = getRankLabel(tier);

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{
        borderColor: tier.color,
        color: tier.color,
        backgroundColor: `${tier.color}15`,
      }}
    >
      {label}
    </span>
  );
}
