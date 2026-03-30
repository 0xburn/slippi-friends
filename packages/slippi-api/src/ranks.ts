export interface RankTier {
  name: string;
  tier: number;
  color: string;
}

// Thresholds extracted from slippi.gg production JS bundle (2026-03)
type RankRule = { min: number; name: string; tier: number; color: string };

const RANK_RULES: RankRule[] = [
  { min: 2350,    name: "Master",   tier: 3, color: "#8B008B" },
  { min: 2275,    name: "Master",   tier: 2, color: "#8B008B" },
  { min: 2191.75, name: "Master",   tier: 1, color: "#8B008B" },
  { min: 2136.28, name: "Diamond",  tier: 3, color: "#4169E1" },
  { min: 2073.67, name: "Diamond",  tier: 2, color: "#4169E1" },
  { min: 2003.92, name: "Diamond",  tier: 1, color: "#4169E1" },
  { min: 1927.03, name: "Platinum", tier: 3, color: "#91E8E0" },
  { min: 1843,    name: "Platinum", tier: 2, color: "#91E8E0" },
  { min: 1751.83, name: "Platinum", tier: 1, color: "#91E8E0" },
  { min: 1653.52, name: "Gold",     tier: 3, color: "#F6A51E" },
  { min: 1548.07, name: "Gold",     tier: 2, color: "#F6A51E" },
  { min: 1435.48, name: "Gold",     tier: 1, color: "#F6A51E" },
  { min: 1315.75, name: "Silver",   tier: 3, color: "#B5A5B7" },
  { min: 1188.88, name: "Silver",   tier: 2, color: "#B5A5B7" },
  { min: 1054.87, name: "Silver",   tier: 1, color: "#B5A5B7" },
  { min: 913.72,  name: "Bronze",   tier: 3, color: "#E06A36" },
  { min: 765.43,  name: "Bronze",   tier: 2, color: "#E06A36" },
];

const BRONZE_1: RankTier = { name: "Bronze", tier: 1, color: "#E06A36" };

export function getRankTier(rating: number): RankTier {
  for (const rule of RANK_RULES) {
    if (rating >= rule.min) {
      return { name: rule.name, tier: rule.tier, color: rule.color };
    }
  }
  return BRONZE_1;
}

export function getRankLabel(tier: RankTier): string {
  return `${tier.name} ${tier.tier}`;
}
