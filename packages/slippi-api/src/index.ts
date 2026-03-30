/// <reference lib="dom" />

export * from "./characters";
export * from "./ranks";
export * from "./stages";

export const ACCOUNT_MANAGEMENT_PAGE_QUERY = `
fragment profileFields on NetplayProfile {
  ratingOrdinal
  ratingUpdateCount
  wins
  losses
  dailyGlobalPlacement
  continent
  characters {
    character
    gameCount
    __typename
  }
  __typename
}

query PlayerLookup($cc: String, $uid: String) {
  getUser(connectCode: $cc, fbUid: $uid) {
    fbUid
    displayName
    connectCode {
      code
      __typename
    }
    status
    rankedNetplayProfile {
      ...profileFields
      __typename
    }
    rankedNetplayProfileHistory {
      ...profileFields
      season {
        id
        name
        status
        __typename
      }
      __typename
    }
    __typename
  }
}
`.trim();

export interface SlippiPlayerData {
  fbUid: string;
  displayName: string;
  connectCode: string;
  rankedRating: number | null;
  rankedWins: number;
  rankedLosses: number;
  globalPlacement: number | null;
  continent: string | null;
  characters: Array<{ character: number; gameCount: number }>;
  subscriptionLevel: string | null;
}

interface SlippiUser {
  fbUid?: string;
  displayName?: string;
  connectCode?: { code?: string | null } | null;
  activeSubscription?: { level?: string | null } | null;
  rankedNetplayProfile?: {
    ratingOrdinal?: number | null;
    wins?: number | null;
    losses?: number | null;
    dailyGlobalPlacement?: number | null;
    continent?: string | null;
    characters?: Array<{
      character?: number | null;
      gameCount?: number | null;
    }> | null;
  } | null;
}

export async function fetchSlippiPlayer(
  connectCode: string,
): Promise<SlippiPlayerData | null> {
  try {
    const response = await fetch(
      "https://internal.slippi.gg/graphql",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: "PlayerLookup",
          variables: { cc: connectCode, uid: connectCode },
          query: ACCOUNT_MANAGEMENT_PAGE_QUERY,
        }),
      },
    );

    const data = (await response.json()) as {
      data?: {
        getUser?: SlippiUser | null;
      };
    };

    const user = data?.data?.getUser ?? null;
    if (!user?.fbUid) {
      return null;
    }

    const ranked = user.rankedNetplayProfile;
    const code = user.connectCode?.code ?? connectCode;

    return {
      fbUid: user.fbUid,
      displayName: user.displayName ?? "",
      connectCode: code,
      rankedRating: ranked?.ratingOrdinal ?? null,
      rankedWins: ranked?.wins ?? 0,
      rankedLosses: ranked?.losses ?? 0,
      globalPlacement: ranked?.dailyGlobalPlacement ?? null,
      continent: ranked?.continent ?? null,
      characters: (ranked?.characters ?? [])
        .filter(
          (c): c is { character: number; gameCount: number } =>
            typeof c?.character === "number" && typeof c?.gameCount === "number",
        )
        .map((c) => ({
          character: c.character,
          gameCount: c.gameCount,
        })),
      subscriptionLevel: user.activeSubscription?.level ?? null,
    };
  } catch {
    return null;
  }
}
