export interface RankTier { name: string; tier: number; color: string; }

// Thresholds extracted from slippi.gg production JS bundle (2026-03)
export function getRankTier(rating: number): RankTier {
  if (rating >= 2350)    return { name: 'Master',   tier: 3, color: '#8B008B' };
  if (rating >= 2275)    return { name: 'Master',   tier: 2, color: '#8B008B' };
  if (rating >= 2191.75) return { name: 'Master',   tier: 1, color: '#8B008B' };
  if (rating >= 2136.28) return { name: 'Diamond',  tier: 3, color: '#4169E1' };
  if (rating >= 2073.67) return { name: 'Diamond',  tier: 2, color: '#4169E1' };
  if (rating >= 2003.92) return { name: 'Diamond',  tier: 1, color: '#4169E1' };
  if (rating >= 1927.03) return { name: 'Platinum', tier: 3, color: '#91E8E0' };
  if (rating >= 1843)    return { name: 'Platinum', tier: 2, color: '#91E8E0' };
  if (rating >= 1751.83) return { name: 'Platinum', tier: 1, color: '#91E8E0' };
  if (rating >= 1653.52) return { name: 'Gold',     tier: 3, color: '#F6A51E' };
  if (rating >= 1548.07) return { name: 'Gold',     tier: 2, color: '#F6A51E' };
  if (rating >= 1435.48) return { name: 'Gold',     tier: 1, color: '#F6A51E' };
  if (rating >= 1315.75) return { name: 'Silver',   tier: 3, color: '#B5A5B7' };
  if (rating >= 1188.88) return { name: 'Silver',   tier: 2, color: '#B5A5B7' };
  if (rating >= 1054.87) return { name: 'Silver',   tier: 1, color: '#B5A5B7' };
  if (rating >= 913.72)  return { name: 'Bronze',   tier: 3, color: '#E06A36' };
  if (rating >= 765.43)  return { name: 'Bronze',   tier: 2, color: '#E06A36' };
  return { name: 'Bronze', tier: 1, color: '#E06A36' };
}

export function getRankLabel(tier: RankTier): string {
  return `${tier.name} ${tier.tier}`;
}
