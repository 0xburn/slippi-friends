import { getRankTier, getRankLabel } from '../lib/ranks';
import { IS_APRIL_FOOLS } from '../lib/aprilFools';

export function RankBadge({ rating, overrideLabel }: { rating: number | null; overrideLabel?: string }) {
  if (rating == null) return null;
  const tier = getRankTier(rating);
  const label = overrideLabel || getRankLabel(tier);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap shrink-0"
      style={{ borderColor: tier.color, color: tier.color, backgroundColor: `${tier.color}15` }}>
      {label}
    </span>
  );
}

export function ToxicBadge() {
  if (!IS_APRIL_FOOLS) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 border-red-500 text-red-500 bg-red-500/10 animate-pulse">
      ☢ TOXIC
    </span>
  );
}
