const now = new Date();
export const IS_APRIL_FOOLS = now.getMonth() === 3 && now.getDate() === 1;

export const AF = IS_APRIL_FOOLS
  ? {
      appName: 'Grinder',
      tagline: 'find melee players near you',
      logo: './grinder.png',
      primary: '#F5A623',
      primaryHover: '#D4901E',
      shareBlurb:
        "check out Grinder™, the app for finding melee players near you! grind ranked, find practice partners, and connect with local players 🎮💪\nhttps://luckystats.gg/friendlies",
      playerCountLabel: 'grinders online',
    }
  : {
      appName: 'friendlies',
      tagline: null as string | null,
      logo: './logo.png',
      primary: '#21BA45',
      primaryHover: '#1ea33e',
      shareBlurb:
        "check out friendlies, a friends list for melee by Lucky 7s! see who's online, manage your friend list, and find new practice partners!\nhttps://luckystats.gg/friendlies",
      playerCountLabel: 'players on friendlies',
    };

export const ARMADA_PLAYER = {
  id: 'af-armada',
  friendId: 'af-armada',
  connectCode: 'ARMD#0',
  displayName: 'Armada',
  avatarUrl: './armada1.jpg',
  region: 'Gothenburg, Sweden',
  rating: 2500,
  characterId: 12,
  topCharacters: [{ characterId: 12, gameCount: 9999 }],
  status: 'online' as const,
  onApp: true,
  friendStatus: 'accepted' as const,
  lookingToPlay: true,
  statusPreset: 'Down for friendlies',
  currentCharacter: null,
  opponentCode: null,
  playingSince: null,
  connectionType: 'ethernet' as const,
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function isToxic(connectCode: string): boolean {
  if (!IS_APRIL_FOOLS) return false;
  return hashCode(connectCode) % 4 === 0;
}
