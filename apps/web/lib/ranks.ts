export interface RankTier {
  name: string;
  tier: number;
  color: string;
}

export function getRankTier(rating: number): RankTier {
  if (rating >= 2275) return { name: 'Master', tier: 0, color: '#8B008B' };
  if (rating >= 2191.13) return { name: 'Diamond', tier: 3, color: '#4169E1' };
  if (rating >= 2136.29) return { name: 'Diamond', tier: 2, color: '#4169E1' };
  if (rating >= 2003.22) return { name: 'Diamond', tier: 1, color: '#4169E1' };
  if (rating >= 1927.19) return { name: 'Platinum', tier: 3, color: '#00CED1' };
  if (rating >= 1843.14) return { name: 'Platinum', tier: 2, color: '#00CED1' };
  if (rating >= 1751.94) return { name: 'Platinum', tier: 1, color: '#00CED1' };
  if (rating >= 1653.61) return { name: 'Gold', tier: 3, color: '#FFD700' };
  if (rating >= 1548.13) return { name: 'Gold', tier: 2, color: '#FFD700' };
  if (rating >= 1435.52) return { name: 'Gold', tier: 1, color: '#FFD700' };
  if (rating >= 1315.77) return { name: 'Silver', tier: 3, color: '#C0C0C0' };
  if (rating >= 1188.89) return { name: 'Silver', tier: 2, color: '#C0C0C0' };
  if (rating >= 1054.87) return { name: 'Silver', tier: 1, color: '#C0C0C0' };
  if (rating >= 913.72) return { name: 'Bronze', tier: 3, color: '#CD7F32' };
  if (rating >= 765.43) return { name: 'Bronze', tier: 2, color: '#CD7F32' };
  return { name: 'Bronze', tier: 1, color: '#CD7F32' };
}

export function getRankLabel(tier: RankTier): string {
  if (tier.name === 'Master') return 'Master';
  return `${tier.name} ${tier.tier}`;
}
