export interface RankTier {
  name: string;
  tier: number;
  color: string;
}

type RankRule = { min: number; name: string; tier: number; color: string };

const RANK_RULES: RankRule[] = [
  { min: 2275, name: "Master", tier: 0, color: "#8B008B" },
  { min: 2191.13, name: "Diamond", tier: 3, color: "#4169E1" },
  { min: 2136.29, name: "Diamond", tier: 2, color: "#4169E1" },
  { min: 2003.22, name: "Diamond", tier: 1, color: "#4169E1" },
  { min: 1927.19, name: "Platinum", tier: 3, color: "#00CED1" },
  { min: 1843.14, name: "Platinum", tier: 2, color: "#00CED1" },
  { min: 1751.94, name: "Platinum", tier: 1, color: "#00CED1" },
  { min: 1653.61, name: "Gold", tier: 3, color: "#FFD700" },
  { min: 1548.13, name: "Gold", tier: 2, color: "#FFD700" },
  { min: 1435.52, name: "Gold", tier: 1, color: "#FFD700" },
  { min: 1315.77, name: "Silver", tier: 3, color: "#C0C0C0" },
  { min: 1188.89, name: "Silver", tier: 2, color: "#C0C0C0" },
  { min: 1054.87, name: "Silver", tier: 1, color: "#C0C0C0" },
  { min: 913.72, name: "Bronze", tier: 3, color: "#CD7F32" },
  { min: 765.43, name: "Bronze", tier: 2, color: "#CD7F32" },
];

const BRONZE_1: RankTier = { name: "Bronze", tier: 1, color: "#CD7F32" };

export function getRankTier(rating: number): RankTier {
  for (const rule of RANK_RULES) {
    if (rating >= rule.min) {
      return { name: rule.name, tier: rule.tier, color: rule.color };
    }
  }
  return BRONZE_1;
}

export function getRankLabel(tier: RankTier): string {
  if (tier.tier === 0) {
    return tier.name;
  }
  return `${tier.name} ${tier.tier}`;
}
