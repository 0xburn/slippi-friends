# Slippi Friends — Product & Technical Specification

## Overview

**Slippi Friends** is a companion app for the Super Smash Bros. Melee netplay community that adds a social layer on top of the Slippi Online ecosystem. It lets players claim their Slippi identity, link social profiles, track recent opponents, see who's online, and manage a friends list — features the official Slippi client does not provide.

The product has two components:
1. **A lightweight Electron desktop agent** that runs alongside Slippi Dolphin, watches for games, detects presence, and handles identity verification
2. **A Next.js web app** that serves as the social hub — profiles, friends list, online status, and opponent history

---

## Table of Contents

1. [Product Requirements](#1-product-requirements)
2. [Architecture](#2-architecture)
3. [Slippi Ecosystem Reference](#3-slippi-ecosystem-reference)
4. [Electron Desktop Agent](#4-electron-desktop-agent)
5. [Next.js Web Application](#5-nextjs-web-application)
6. [Supabase Backend](#6-supabase-backend)
7. [Slippi GraphQL API Integration](#7-slippi-graphql-api-integration)
8. [Lucky Stats Integration](#8-lucky-stats-integration)
9. [Authentication & Security](#9-authentication--security)
10. [Data Models](#10-data-models)
11. [API Routes](#11-api-routes)
12. [Presence System](#12-presence-system)
13. [Design & UI Direction](#13-design--ui-direction)
14. [Monorepo Structure](#14-monorepo-structure)
15. [Build & Distribution](#15-build--distribution)
16. [Development Workflow](#16-development-workflow)
17. [Future Considerations](#17-future-considerations)

---

## 1. Product Requirements

### Core User Stories

1. **As a Melee player**, I want to claim my Slippi connect code so others can find my profile
2. **As a Melee player**, I want to see a list of recent opponents with their connect codes, characters, and ranks after each session
3. **As a Melee player**, I want to add social links (Discord, Twitter, Twitch) to my profile so opponents can find me
4. **As a Melee player**, I want to see which of my friends are currently online and whether they're in a game or idle
5. **As a Melee player**, I want to add opponents as friends and build a persistent friends list
6. **As a Melee player**, I want to see my opponent's profile (rank, mains, socials) automatically after a game
7. **As a Lucky Stats tournament player**, I want to link my Lucky Stats profile to display my tournament ELO alongside my Slippi ranked rating

### MVP Scope (v1)

- Discord OAuth login
- Slippi identity verification via local `user.json`
- Replay directory watcher that extracts opponent info from .slp files in real time
- Online presence detection (Dolphin process check + heartbeat)
- Player profiles with connect code, display name, ranked stats, character mains, and social links
- Recent opponents list
- Friends list (add/remove)
- "Who's Online" view showing friends' current status (offline / online / in-game)
- Web app for browsing profiles and managing friends

### Post-MVP (v2+)

- Lucky Stats ELO integration
- Match history with W/L record against specific opponents
- Notification when a friend comes online
- Auto-copy connect code to clipboard for Direct Connect
- In-app chat or Discord DM bridge
- Regional leaderboard integration
- Mobile-responsive PWA

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│            Electron Desktop Agent               │
│                                                 │
│  ┌───────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Identity   │ │ Replay   │ │  Presence     │  │
│  │ Manager    │ │ Watcher  │ │  Detector     │  │
│  │            │ │          │ │               │  │
│  │ reads      │ │ watches  │ │ polls for     │  │
│  │ user.json  │ │ .slp dir │ │ Dolphin proc  │  │
│  └─────┬──────┘ └────┬─────┘ └──────┬────────┘  │
│        │             │              │            │
│        └─────────────┼──────────────┘            │
│                      │                           │
│              ┌───────▼────────┐                  │
│              │  Supabase      │                  │
│              │  Client        │                  │
│              │  (auth + RT)   │                  │
│              └───────┬────────┘                  │
│                      │                           │
│  ┌───────────────────▼───────────────────────┐   │
│  │  Tray Icon UI (minimal)                   │   │
│  │  • Status indicator (online/offline)      │   │
│  │  • "Open Web App" link                    │   │
│  │  • Latest opponent toast notification     │   │
│  │  • Settings (replay dir, auto-launch)     │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────┘
                       │
                       │ WebSocket (Supabase Realtime)
                       │ + REST (Supabase PostgREST)
                       │
┌──────────────────────▼───────────────────────────┐
│              Supabase Backend                     │
│                                                   │
│  ┌─────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Auth    │ │ Postgres │ │  Realtime         │  │
│  │ (Discord │ │ (profiles│ │  (Presence        │  │
│  │  OAuth)  │ │  friends │ │   channels)       │  │
│  │         │ │  matches) │ │                   │  │
│  └─────────┘ └──────────┘ └───────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │  Edge Functions                             │  │
│  │  • /verify-slippi — cross-check UID→code    │  │
│  │  • /enrich-player — fetch Slippi ranked API │  │
│  │  • /link-luckystats — verify LS profile     │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
   ┌────────────┐ ┌─────────┐ ┌──────────┐
   │ Slippi     │ │ Lucky   │ │ Next.js  │
   │ GraphQL    │ │ Stats   │ │ Web App  │
   │ API        │ │ API     │ │ (Vercel) │
   │(unofficial)│ │         │ │          │
   └────────────┘ └─────────┘ └──────────┘
```

---

## 3. Slippi Ecosystem Reference

### Key Data Sources

#### `user.json` — Local Slippi Identity File

This file is created by the Slippi Launcher and read by Dolphin (Ishiiruka) for matchmaking. It contains the authenticated user's identity.

**File locations by platform:**
- **Windows:** Same directory as the Slippi Dolphin executable, typically `C:\Users\{user}\AppData\Local\Programs\slippi-launcher\resources\app.asar.unpacked\dolphin\`
- **macOS:** `~/Library/Application Support/Slippi Launcher/netplay/` (may vary by version)
- **Linux:** `~/.config/SlippiOnline/`

**Structure:**
```json
{
  "uid": "firebase-uid-string-here",
  "playKey": "play-key-string",
  "connectCode": "ABCD#123",
  "displayName": "PlayerName",
  "latestVersion": "3.4.0"
}
```

The `uid` is a Firebase UID that uniquely identifies the Slippi account. The `connectCode` is the human-readable tag (e.g., `PETE#123`). The `playKey` is an auth token for matchmaking — **do not transmit or store this**.

#### `.slp` Replay Files

Slippi writes a `.slp` replay file for every online game. The file uses UBJSON encoding. Key identity data is available in the **Game Start** event, which is written at the very beginning of the file:

**Per-player fields in Game Start:**
- `connectCode` — e.g., `ABCD#0` (uses full-width `#` character, `0x8194`)
- `displayName` — the player's display name
- `userId` — Firebase UID (added in slippi-js v6+)
- `characterId` — numeric character ID
- `characterColor` — costume index
- `playerType` — 0 = human, 1 = CPU
- `port` — 0-3 (port 1-4)

**Metadata section** (written at game end) also contains:
```json
{
  "players": {
    "0": {
      "characters": { "18": 5209 },
      "names": {
        "netplay": "PlayerName",
        "code": "ABCD#0"
      }
    }
  }
}
```

**Default replay directory locations:**
- **Windows:** `C:\Users\{user}\Documents\Slippi\` or as configured in Slippi Launcher settings
- **macOS:** `~/Slippi/` or as configured
- **Linux:** `~/Slippi/` or as configured

The Electron agent should allow users to configure this path but attempt auto-detection first.

#### Slippi GraphQL API (Unofficial)

The community has reverse-engineered the GraphQL endpoint that powers slippi.gg profile pages. It is hosted on a separate backend (likely a GCP Cloud Function wrapping Firestore).

**Endpoint:** `https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql`

**Headers:**
```
Content-Type: application/json
Origin: https://slippi.gg
Referer: https://slippi.gg/
```

**Query — Lookup by Connect Code:**
```graphql
fragment profileFields on NetplayProfile {
  id
  ratingOrdinal
  ratingUpdateCount
  wins
  losses
  dailyGlobalPlacement
  dailyRegionalPlacement
  continent
  characters {
    id
    character
    gameCount
    __typename
  }
  __typename
}

fragment userProfilePage on User {
  fbUid
  displayName
  connectCode {
    code
    __typename
  }
  status
  activeSubscription {
    level
    hasGiftSub
    __typename
  }
  rankedNetplayProfile {
    ...profileFields
    __typename
  }
  netplayProfiles {
    ...profileFields
    season {
      id
      startedAt
      endedAt
      name
      status
      __typename
    }
    __typename
  }
  __typename
}

query AccountManagementPageQuery($cc: String!, $uid: String!) {
  getUser(fbUid: $uid) {
    ...userProfilePage
    __typename
  }
  getConnectCode(code: $cc) {
    user {
      ...userProfilePage
      __typename
    }
    __typename
  }
}
```

**Variables:** `{ "cc": "ABCD#123", "uid": "ABCD#123" }`

(When looking up by connect code, pass the code as both `cc` and `uid` — the API resolves whichever it can.)

**Response fields of interest:**
- `displayName` — current display name
- `connectCode.code` — canonical connect code
- `fbUid` — Firebase UID
- `rankedNetplayProfile.ratingOrdinal` — ELO-like rating (float, e.g. 2134.56)
- `rankedNetplayProfile.wins` / `losses` — current season record
- `rankedNetplayProfile.characters` — array of `{ character, gameCount }`
- `rankedNetplayProfile.dailyGlobalPlacement` — daily global rank
- `rankedNetplayProfile.continent` — region string

**Rank tiers by ratingOrdinal (approximate):**
| Rating Range | Rank |
|---|---|
| 0 - 765.42 | Bronze 1 |
| 765.43 - 913.71 | Bronze 2 |
| 913.72 - 1054.86 | Bronze 3 |
| 1054.87 - 1188.88 | Silver 1 |
| 1188.89 - 1315.76 | Silver 2 |
| 1315.77 - 1435.51 | Silver 3 |
| 1435.52 - 1548.12 | Gold 1 |
| 1548.13 - 1653.60 | Gold 2 |
| 1653.61 - 1751.93 | Gold 3 |
| 1751.94 - 1843.13 | Platinum 1 |
| 1843.14 - 1927.18 | Platinum 2 |
| 1927.19 - 2003.21 | Platinum 3 |
| 2003.22 - 2136.28 | Diamond 1 |
| 2136.29 - 2191.12 | Diamond 2 |
| 2191.13 - 2274.99 | Diamond 3 |
| 2275.00+ | Master |

**IMPORTANT:** This API is undocumented and unofficial. It may break at any time. Implement caching aggressively (cache player data for 1 hour minimum) and rate-limit requests. Do not hammer the endpoint. Community leaderboard projects all warn about this.

#### Dolphin Process Names

To detect whether the user has Slippi Dolphin running:

- **Windows:** `Slippi Dolphin.exe` or `Dolphin.exe` (check both)
- **macOS:** `Slippi Dolphin` (the process name from the .app bundle, may appear as `dolphin-emu` in some builds)
- **Linux:** `dolphin-emu` or `AppRun` (if running from AppImage)

Use the `find-process` npm package (cross-platform, Promise-based) to detect:
```typescript
import find from 'find-process';
const processes = await find('name', 'Slippi Dolphin');
// Also check: 'dolphin-emu', 'Dolphin.exe'
```

---

## 4. Electron Desktop Agent

### Overview

The Electron app runs as a **system tray application** — no main window. It sits in the taskbar/menu bar with a small icon and a context menu. Its job is:

1. Authenticate the user (Discord OAuth via Supabase)
2. Read `user.json` to get their Slippi identity
3. Watch the replay directory for new `.slp` files
4. Detect Dolphin process for presence
5. Report presence and opponent data to the Supabase backend
6. Show toast notifications for new opponents

### Technology Stack

- **Electron** (latest stable) with **electron-builder** for packaging
- **TypeScript** throughout
- **@slippi/slippi-js** (Node.js entry: `@slippi/slippi-js/node`) for parsing .slp files
- **@supabase/supabase-js** for auth, database, and realtime
- **find-process** for cross-platform process detection
- **chokidar** for file system watching
- **electron-store** for persisting local settings (replay dir path, auto-launch preference)

### Module Breakdown

#### `src/main.ts` — Electron Main Process

- Creates the system tray icon and context menu
- Manages the OAuth flow (opens system browser for Discord login, handles the callback via deep link `slippi-friends://auth-callback`)
- Initializes all modules on startup
- Registers the app as a startup item (optional, user-configurable)

Register a custom protocol handler so Supabase OAuth redirects back to the app:
```typescript
app.setAsDefaultProtocolClient('slippi-friends');
```

#### `src/identity.ts` — Slippi Identity Manager

Responsible for finding and reading the local `user.json` file.

```typescript
interface SlippiIdentity {
  uid: string;
  connectCode: string;
  displayName: string;
  // DO NOT include playKey
}
```

**Auto-detection logic:**
1. Check platform-specific default locations (see Section 3)
2. Walk up from the Slippi Launcher install path if detectable
3. Fall back to asking the user to locate it manually via a file dialog
4. Cache the found path in electron-store for subsequent launches

**Verification flow:**
1. Read `uid` and `connectCode` from `user.json`
2. Call the Supabase edge function `/verify-slippi` which hits the Slippi GraphQL API with the UID
3. Confirm the returned connect code matches what's in the file
4. Store the verified identity in the Supabase `profiles` table

#### `src/watcher.ts` — Replay Directory Watcher

Watches the Slippi replay output directory for new `.slp` files.

```typescript
import chokidar from 'chokidar';
import { SlippiGame } from '@slippi/slippi-js/node';

const watcher = chokidar.watch(replayDir, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 500,
  },
});

watcher.on('add', async (filePath) => {
  if (!filePath.endsWith('.slp')) return;
  await processNewReplay(filePath);
});
```

**`processNewReplay(filePath)`:**
1. Create a `SlippiGame` instance with `{ processOnTheFly: true }`
2. Read settings via `game.getSettings()` — this is available almost immediately
3. Extract each player's `connectCode`, `displayName`, `userId`, `characterId`, `characterColor`
4. Filter out the local player (match against the identity from `identity.ts`)
5. The remaining player(s) are opponents
6. Upsert opponent data to Supabase `matches` table
7. If the opponent has a profile in our system, show a toast notification with their info
8. If not, enrich from the Slippi GraphQL API and cache

**Handling live reads:** The `processOnTheFly` flag lets us re-read the same `SlippiGame` instance as the file grows. We can detect game end by checking `game.getGameEnd()` on a polling interval and update the match record with the result.

#### `src/presence.ts` — Presence Detector

Combines process detection with replay activity to determine user status.

```typescript
type PresenceStatus = 'offline' | 'online' | 'in-game';
```

**Polling loop (every 15 seconds):**
1. Check if Dolphin is running via `find-process`
2. Check if any `.slp` file in the replay dir has been modified in the last 30 seconds
3. Determine status:
   - No Dolphin process → `offline`
   - Dolphin running, no active replay → `online`
   - Dolphin running + active replay file → `in-game`
4. Report status to Supabase Realtime Presence channel

```typescript
const channel = supabase.channel('presence:global');

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      visibleId: myConnectCode,
      status: currentStatus,
      currentCharacter: lastPlayedCharacter || null,
      updatedAt: new Date().toISOString(),
    });
  }
});
```

When the app closes or the user logs out, call `channel.untrack()` to cleanly remove presence.

#### `src/supabase.ts` — Supabase Client

Initialize the Supabase client with the **public anon key** (safe to embed — all security is via RLS):

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,        // e.g., https://xxxx.supabase.co
  process.env.SUPABASE_ANON_KEY!    // public anon key, NOT the service role key
);
```

These values are bundled into the Electron app. The anon key is designed to be public — it's equivalent to a project identifier. Row Level Security (RLS) on the database enforces all access control.

#### `src/tray.ts` — System Tray UI

Minimal tray interface:

- **Tray icon:** Green dot = online, yellow = in-game, grey = offline
- **Context menu items:**
  - Status display (e.g., "Online as PETE#123")
  - "Open Slippi Friends" → opens the web app in the default browser
  - "Recent Opponents" → submenu showing last 5 opponents with connect codes
  - Separator
  - "Settings" → opens a small settings window
  - "Log Out"
  - "Quit"

#### Settings Window

A small Electron BrowserWindow (400x300) with:
- Replay directory path (text field + browse button)
- Auto-launch on startup (checkbox)
- Notification preferences (checkbox: show toast on new opponent)

---

## 5. Next.js Web Application

### Overview

The web app is the main user-facing product. It's a Next.js app deployed on Vercel. It handles:

- Profile viewing and editing
- Friends list management
- Online status display
- Recent opponents browsing
- Profile claiming flow (for users who start on the web)

### Technology Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** for styling (but see Design section — go beyond defaults)
- **@supabase/ssr** for server-side Supabase auth
- **@supabase/supabase-js** for client-side realtime
- **Deployed on Vercel**

### Routes / Pages

#### `/` — Landing Page
- Hero explaining the product
- CTA: "Download the Agent" and "Sign in with Discord"
- Live count of online players (pulled from Supabase Presence)
- Feature highlights

#### `/profile/[connectCode]` — Player Profile (Public)
- Display name, connect code, avatar (Discord avatar pulled from auth)
- Slippi ranked stats: rating, rank tier, W/L, global placement
- Character mains with game counts (visualized as a bar chart or character icons)
- Social links: Discord, Twitter, Twitch (only shown if the user has claimed and added them)
- Lucky Stats ELO (v2)
- Current online status badge (live via Supabase Realtime)
- "Add Friend" button (if logged in and not already friends)
- Recent match history against the viewer (if both are registered)

#### `/friends` — Friends List (Authenticated)
- List of all friends with:
  - Current status (offline/online/in-game) — live updating
  - Connect code, display name, rank
  - Last seen timestamp if offline
  - Character they're currently playing (if in-game)
- "Remove Friend" action
- Search/filter

#### `/online` — Who's Online (Authenticated)
- Real-time list of all friends currently online or in-game
- Shows connect code (with copy-to-clipboard button for Direct Connect)
- Sorted: in-game first, then online, then recently online

#### `/opponents` — Recent Opponents (Authenticated)
- Chronological list of people you've played against
- Each entry shows: connect code, display name, character played, time, ranked stats
- "Add Friend" button for each
- Link to their profile
- Filter by date range

#### `/settings` — Account Settings (Authenticated)
- Edit social links (Discord, Twitter, Twitch, custom URL)
- Link/unlink Lucky Stats profile
- Privacy settings (e.g., hide online status from non-friends)
- Delete account

#### `/claim` — Claim Profile (Authenticated)
For users who sign up via the web but haven't installed the Electron agent yet:
- Instructions to download and install the agent
- Status indicator showing whether the agent has verified their identity
- Manual connect code entry with verification pending state

### Components

#### `<OnlineIndicator />`
A small colored dot component:
- Green pulsing dot = online
- Yellow dot = in-game
- Grey dot = offline

Uses Supabase Realtime Presence subscription to update in real time.

#### `<PlayerCard />`
Reusable card showing a player's identity:
- Character icon (main), connect code, display name
- Rank badge
- Online status indicator
- Click → navigate to profile

#### `<RankBadge />`
Visual badge showing the player's Slippi rank tier with appropriate color:
- Bronze (brown), Silver (grey), Gold (yellow), Platinum (teal), Diamond (blue), Master (purple/red)

#### `<CharacterIcon />`
Renders the Melee character stock icon given a character ID. Use the community stock icon sprite sheet or individual PNGs. Character IDs map to: 0=Falcon, 1=DK, 2=Fox, etc. (standard Melee internal IDs).

---

## 6. Supabase Backend

### Project Setup

Create a new Supabase project. You'll need:
- The **Project URL** (e.g., `https://xxxx.supabase.co`)
- The **Anon (public) key** — safe to embed in client apps
- The **Service Role key** — used ONLY in Edge Functions, NEVER in client code

### Auth Configuration

Enable **Discord** as an OAuth provider in Supabase Auth settings:
1. Create a Discord application at https://discord.com/developers
2. Set the OAuth2 redirect URL to both:
   - `https://xxxx.supabase.co/auth/v1/callback` (for the web app)
   - `slippi-friends://auth-callback` (for the Electron app deep link)
3. Copy the Client ID and Client Secret into Supabase Auth → Providers → Discord

### Database Schema

See Section 10 for full DDL. Key tables:

- `profiles` — one per user, stores Slippi identity + social links
- `friends` — friend relationships (bidirectional)
- `matches` — recorded opponent encounters from replay parsing
- `slippi_cache` — cached Slippi API responses to avoid hammering their endpoint

### Row Level Security (RLS) Policies

**CRITICAL:** Every table must have RLS enabled. The anon key is public — RLS is the only thing preventing unauthorized access.

```sql
-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_owner_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends: users can only see/manage their own friendships
CREATE POLICY "friends_own_read" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friends_own_insert" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friends_own_delete" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Matches: users can read their own matches, insert their own
CREATE POLICY "matches_own_read" ON matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "matches_own_insert" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Slippi cache: anyone can read (it's public data), only service role can write
CREATE POLICY "slippi_cache_public_read" ON slippi_cache
  FOR SELECT USING (true);
```

### Edge Functions

#### `verify-slippi`

Called during the identity claim flow. Receives the user's UID (from `user.json`) and connect code. Hits the Slippi GraphQL API server-side (using the service role for DB writes) to confirm the UID maps to the claimed connect code.

```typescript
// supabase/functions/verify-slippi/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { slippiUid, connectCode } = await req.json();
  
  // Hit Slippi GraphQL API
  const slippiResponse = await fetch(
    'https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://slippi.gg',
      },
      body: JSON.stringify({
        operationName: 'AccountManagementPageQuery',
        variables: { cc: connectCode, uid: slippiUid },
        query: SLIPPI_QUERY, // the full query from Section 3
      }),
    }
  );

  const data = await slippiResponse.json();
  const user = data?.data?.getConnectCode?.user;

  if (!user || user.fbUid !== slippiUid) {
    return new Response(JSON.stringify({ verified: false }), { status: 400 });
  }

  // Update the user's profile with verified Slippi data
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization');
  // Verify the requesting user's JWT to get their auth.uid()
  const { data: { user: authUser } } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '')
  );

  await supabase.from('profiles').upsert({
    id: authUser.id,
    slippi_uid: slippiUid,
    connect_code: connectCode,
    display_name: user.displayName,
    verified: true,
    verified_at: new Date().toISOString(),
  });

  // Also cache the Slippi ranked data
  if (user.rankedNetplayProfile) {
    await supabase.from('slippi_cache').upsert({
      connect_code: connectCode,
      data: user.rankedNetplayProfile,
      fetched_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ verified: true, profile: user }));
});
```

#### `enrich-player`

Called when we encounter an opponent who isn't in our system. Fetches their data from the Slippi GraphQL API and caches it.

```typescript
// Input: { connectCode: "ABCD#123" }
// Output: { displayName, rating, wins, losses, characters, ... }
// Writes to slippi_cache table
// Respects cache TTL: only re-fetch if cached data is older than 1 hour
```

#### `link-luckystats` (v2)

Handles linking a Lucky Stats profile. This will need a verification mechanism TBD based on Lucky Stats' auth system.

### Realtime Configuration

Enable Realtime on the Supabase project. The presence system uses a channel called `presence:global` that all connected Electron agents subscribe to. The web app also subscribes to this channel to display live online status.

---

## 7. Slippi GraphQL API Integration

### Wrapper Module

Create a shared utility (used by both Edge Functions and optionally the Electron agent for local caching):

```typescript
// packages/slippi-api/src/index.ts

const SLIPPI_GQL_ENDPOINT = 'https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql';

export interface SlippiPlayerData {
  fbUid: string;
  displayName: string;
  connectCode: string;
  rankedRating: number | null;
  rankedWins: number;
  rankedLosses: number;
  globalPlacement: number | null;
  continent: string | null;
  characters: Array<{
    character: number;    // Melee internal character ID
    gameCount: number;
  }>;
  subscriptionLevel: string | null;
}

export async function fetchSlippiPlayer(connectCode: string): Promise<SlippiPlayerData | null> {
  const response = await fetch(SLIPPI_GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://slippi.gg',
      'Referer': 'https://slippi.gg/',
    },
    body: JSON.stringify({
      operationName: 'AccountManagementPageQuery',
      variables: { cc: connectCode, uid: connectCode },
      query: ACCOUNT_QUERY,
    }),
  });

  const data = await response.json();
  const user = data?.data?.getConnectCode?.user;
  if (!user) return null;

  const ranked = user.rankedNetplayProfile;
  return {
    fbUid: user.fbUid,
    displayName: user.displayName,
    connectCode: user.connectCode?.code,
    rankedRating: ranked?.ratingOrdinal ?? null,
    rankedWins: ranked?.wins ?? 0,
    rankedLosses: ranked?.losses ?? 0,
    globalPlacement: ranked?.dailyGlobalPlacement ?? null,
    continent: ranked?.continent ?? null,
    characters: (ranked?.characters ?? []).map((c: any) => ({
      character: c.character,
      gameCount: c.gameCount,
    })),
    subscriptionLevel: user.activeSubscription?.level ?? null,
  };
}
```

### Caching Strategy

- Cache Slippi API responses in the `slippi_cache` table
- TTL: 1 hour for ranked stats (they change after every game)
- TTL: 24 hours for identity data (display name, connect code)
- The Electron agent should check local cache before requesting enrichment from the edge function
- Rate limit: max 1 request per second to the Slippi API from any single edge function invocation

---

## 8. Lucky Stats Integration

### Phase 1 (MVP): Display Only

Allow users to manually enter their Lucky Stats username/ID. Display the ELO on their profile without verification. This is low-stakes since it's public data anyway.

### Phase 2: Verified Link

Since Pete owns Lucky Stats, the integration can be tighter:

1. Add a "Link Slippi Code" field to Lucky Stats player profiles
2. When a user claims their Lucky Stats profile in Slippi Friends:
   a. Generate a one-time verification code in Slippi Friends
   b. User enters the code on their Lucky Stats profile page
   c. Slippi Friends backend confirms the code matches
   d. Profile is linked and verified
3. Alternatively, if Lucky Stats has an API: use an API key exchange

### Data to Display

- Lucky Stats tournament ELO
- Recent tournament results
- Tournament win/loss record
- Link to full Lucky Stats profile

---

## 9. Authentication & Security

### Auth Flow — Electron Agent

1. User clicks "Sign in with Discord" in the tray menu
2. Electron opens the system browser to: `https://xxxx.supabase.co/auth/v1/authorize?provider=discord&redirect_to=slippi-friends://auth-callback`
3. User authorizes the Discord app
4. Browser redirects to `slippi-friends://auth-callback#access_token=...&refresh_token=...`
5. Electron intercepts the deep link, extracts the tokens
6. Stores tokens securely via `electron-store` (or `safeStorage` for encryption)
7. Initializes the Supabase client with the session

### Auth Flow — Web App

Standard Supabase Auth with `@supabase/ssr`:
1. User clicks "Sign in with Discord"
2. Redirect to Supabase Auth → Discord OAuth
3. Callback to `/auth/callback` route handler
4. Session cookie set, user redirected to `/friends`

### Security Principles

- **Never embed the Supabase Service Role key** in any client code (Electron or web)
- **Never transmit or store `playKey`** from `user.json` — it's a matchmaking auth token
- **All database access is gated by RLS** — the anon key only grants access within policy bounds
- **Edge Functions use the Service Role key** for privileged operations (verification, cache writes)
- **Discord OAuth tokens** are managed by Supabase Auth — we don't handle them directly
- **Electron deep links** should validate the origin/scheme before processing tokens

---

## 10. Data Models

### SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Slippi identity (populated after verification)
  slippi_uid TEXT UNIQUE,
  connect_code TEXT UNIQUE,
  display_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Social links
  discord_username TEXT,
  discord_id TEXT,           -- from Discord OAuth, auto-populated
  twitter_handle TEXT,
  twitch_handle TEXT,
  custom_url TEXT,
  
  -- Lucky Stats (v2)
  lucky_stats_id TEXT,
  lucky_stats_verified BOOLEAN DEFAULT FALSE,
  lucky_stats_elo NUMERIC,
  
  -- Profile settings
  show_online_status BOOLEAN DEFAULT TRUE,    -- privacy: hide from non-friends
  show_social_links BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-populate discord info from auth metadata on insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, discord_username, discord_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- FRIENDS
-- ==========================================
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate friendships
  UNIQUE(user_id, friend_id),
  -- Prevent self-friending
  CHECK (user_id != friend_id)
);

-- Index for fast lookups
CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

-- ==========================================
-- MATCHES (opponent encounters)
-- ==========================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Opponent info (may not be a registered user)
  opponent_connect_code TEXT NOT NULL,
  opponent_display_name TEXT,
  opponent_slippi_uid TEXT,
  
  -- Game details
  user_character_id INTEGER,
  opponent_character_id INTEGER,
  stage_id INTEGER,
  game_mode TEXT,                  -- 'unranked', 'ranked', 'direct'
  
  -- Result (null if game didn't complete)
  did_win BOOLEAN,
  
  -- File reference
  replay_filename TEXT,
  
  -- Timestamps
  played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_matches_opponent ON matches(opponent_connect_code);
CREATE INDEX idx_matches_played ON matches(played_at DESC);

-- ==========================================
-- SLIPPI CACHE
-- ==========================================
CREATE TABLE slippi_cache (
  connect_code TEXT PRIMARY KEY,
  display_name TEXT,
  slippi_uid TEXT,
  rating_ordinal NUMERIC,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  global_placement INTEGER,
  continent TEXT,
  characters JSONB DEFAULT '[]',        -- array of {character, gameCount}
  subscription_level TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slippi_cache_fetched ON slippi_cache(fetched_at);

-- ==========================================
-- PRESENCE LOG (for "last seen" when user goes offline)
-- ==========================================
CREATE TABLE presence_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,              -- 'online', 'in-game', 'offline'
  current_character INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only keep the latest entry per user
CREATE UNIQUE INDEX idx_presence_log_user ON presence_log(user_id);

-- ==========================================
-- RLS POLICIES (see Section 6 for full policies)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE slippi_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_log ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends
CREATE POLICY "friends_own_read" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friends_own_insert" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_own_delete" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Matches
CREATE POLICY "matches_own_read" ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "matches_own_insert" ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Slippi Cache (public read, service-role write only — no insert/update policy for anon)
CREATE POLICY "cache_public_read" ON slippi_cache FOR SELECT USING (true);

-- Presence Log
CREATE POLICY "presence_public_read" ON presence_log FOR SELECT USING (true);
CREATE POLICY "presence_own_write" ON presence_log
  FOR ALL USING (auth.uid() = user_id);
```

---

## 11. API Routes

### Next.js API Routes (or Supabase Edge Functions)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/profile/[connectCode]` | Get a player's profile + cached Slippi data | No |
| PATCH | `/api/profile` | Update own profile (social links, settings) | Yes |
| GET | `/api/friends` | List current user's friends with online status | Yes |
| POST | `/api/friends` | Add a friend (by connect code or user ID) | Yes |
| DELETE | `/api/friends/[friendId]` | Remove a friend | Yes |
| GET | `/api/opponents` | List recent opponents | Yes |
| POST | `/api/opponents` | Record a new opponent encounter (from Electron agent) | Yes |
| POST | `/api/verify-slippi` | Verify Slippi identity | Yes |
| POST | `/api/enrich-player` | Fetch + cache Slippi data for a connect code | Yes |
| GET | `/api/online` | Get list of online friends (fallback for non-realtime clients) | Yes |

Most of these will be thin wrappers around Supabase client calls, since PostgREST + RLS handles most of the logic. The main exception is `verify-slippi` and `enrich-player` which need server-side API calls.

---

## 12. Presence System

### How It Works

Supabase Realtime Presence is used for real-time online status. Here's the flow:

#### Electron Agent (Publisher)

```typescript
const channel = supabase.channel('presence:global', {
  config: {
    presence: {
      key: myConnectCode,  // use connect code as the presence key
    },
  },
});

channel.on('presence', { event: 'sync' }, () => {
  // Full state sync — useful for initial load
  const state = channel.presenceState();
  // state is: { "PETE#123": [{ status: "online", ... }], "ABCD#456": [...] }
});

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    // Start tracking
    await channel.track({
      connectCode: myConnectCode,
      displayName: myDisplayName,
      status: currentPresenceStatus,  // 'online' | 'in-game'
      currentCharacter: lastCharacterId,
      updatedAt: new Date().toISOString(),
    });
  }
});

// Update presence when status changes
async function updatePresence(newStatus: PresenceStatus) {
  await channel.track({
    connectCode: myConnectCode,
    displayName: myDisplayName,
    status: newStatus,
    currentCharacter: lastCharacterId,
    updatedAt: new Date().toISOString(),
  });
  
  // Also persist to presence_log table for "last seen" after disconnect
  await supabase.from('presence_log').upsert({
    user_id: myUserId,
    status: newStatus,
    current_character: lastCharacterId,
    updated_at: new Date().toISOString(),
  });
}
```

#### Web App (Subscriber)

```typescript
// In a React component or context provider
const channel = supabase.channel('presence:global');

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // Update React state with online users
  setOnlineUsers(
    Object.entries(state).map(([key, presences]) => ({
      connectCode: key,
      ...presences[0],
    }))
  );
});

channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  // A user came online
});

channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  // A user went offline
});

channel.subscribe();
```

#### Handling Disconnects

When the Electron app crashes or the user's internet drops, Supabase automatically removes their presence after a timeout (~30 seconds). The `leave` event fires on all subscribers. The `presence_log` table serves as a fallback for "last seen" timestamps.

---

## 13. Design & UI Direction

### Aesthetic Direction

The Slippi Friends web app should feel like it belongs in the Melee community — **bold, high-energy, competitive gaming aesthetic** with a nod to Slippi's existing green brand color. Think esports dashboard meets social network.

**Tone:** Competitive, clean, high-contrast. Not corporate — it should feel community-built and authentic.

**Color Palette:**
- Primary: Slippi green (`#21BA45` or similar) — used for online indicators, CTAs
- Background: Deep dark (`#0a0a0a` to `#1a1a1a`) — dark mode by default, this is a gaming app
- Accent: Electric blue or cyan for secondary actions
- Rank colors: Bronze (#CD7F32), Silver (#C0C0C0), Gold (#FFD700), Platinum (#00CED1), Diamond (#4169E1), Master (#8B008B)
- Text: White primary, grey-400 secondary
- Danger/offline: Muted red

**Typography:**
- Headlines: A bold, geometric display font — something with character (e.g., Chakra Petch, Orbitron, Rajdhani, or similar gaming/tech feel). NOT Inter or Space Grotesk.
- Body: A clean sans-serif that pairs well — DM Sans, Plus Jakarta Sans, or similar
- Monospace for connect codes: JetBrains Mono or Fira Code

**Key Visual Elements:**
- Character stock icons prominently displayed on profiles and opponent cards
- Rank badges with gradient fills matching the tier colors
- Pulsing green dot for online presence — this should be iconic and immediately recognizable
- Subtle noise/grain texture on dark backgrounds for depth
- Card-based layout for player entries with subtle border glow on hover
- Smooth page transitions

### Electron Tray

Keep it minimal — just a tray icon. The icon should be a simplified Slippi-Friends logo mark, changing color based on status:
- Green = online
- Yellow = in-game  
- Grey = no Dolphin detected
- Small notification badge (red dot) when a new opponent is detected

---

## 14. Monorepo Structure

Use **npm workspaces** (or Turborepo if preferred) for the monorepo:

```
slippi-friends/
├── package.json                    # Root workspace config
├── turbo.json                      # (optional) Turborepo config
├── .gitignore
├── README.md
├── spec.md                         # This file
│
├── packages/
│   └── slippi-api/                 # Shared Slippi GraphQL API wrapper
│       ├── src/
│       │   ├── index.ts            # fetchSlippiPlayer, types
│       │   ├── characters.ts       # Character ID → name/icon mapping
│       │   └── ranks.ts            # Rating → rank tier mapping
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── agent/                      # Electron desktop agent
│   │   ├── src/
│   │   │   ├── main.ts             # Electron main process entry
│   │   │   ├── tray.ts             # System tray management
│   │   │   ├── identity.ts         # user.json reader + verification
│   │   │   ├── watcher.ts          # .slp replay directory watcher
│   │   │   ├── presence.ts         # Dolphin process detection + heartbeat
│   │   │   ├── supabase.ts         # Supabase client init
│   │   │   ├── auth.ts             # Discord OAuth deep link handler
│   │   │   ├── settings.ts         # Settings window
│   │   │   ├── notifications.ts    # Toast notifications for new opponents
│   │   │   └── config.ts           # Platform-specific paths, constants
│   │   ├── assets/
│   │   │   ├── tray-online.png
│   │   │   ├── tray-ingame.png
│   │   │   ├── tray-offline.png
│   │   │   └── icon.png
│   │   ├── electron-builder.yml    # Build/packaging config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                        # Next.js web application
│       ├── app/
│       │   ├── layout.tsx          # Root layout with Supabase provider
│       │   ├── page.tsx            # Landing page
│       │   ├── auth/
│       │   │   └── callback/
│       │   │       └── route.ts    # OAuth callback handler
│       │   ├── profile/
│       │   │   └── [code]/
│       │   │       └── page.tsx    # Player profile page
│       │   ├── friends/
│       │   │   └── page.tsx        # Friends list
│       │   ├── online/
│       │   │   └── page.tsx        # Who's online
│       │   ├── opponents/
│       │   │   └── page.tsx        # Recent opponents
│       │   ├── settings/
│       │   │   └── page.tsx        # Account settings
│       │   └── claim/
│       │       └── page.tsx        # Claim profile flow
│       ├── components/
│       │   ├── PlayerCard.tsx
│       │   ├── OnlineIndicator.tsx
│       │   ├── RankBadge.tsx
│       │   ├── CharacterIcon.tsx
│       │   ├── FriendsList.tsx
│       │   ├── OpponentRow.tsx
│       │   ├── PresenceProvider.tsx  # Context provider for realtime presence
│       │   └── Navigation.tsx
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts       # Browser Supabase client
│       │   │   ├── server.ts       # Server-side Supabase client
│       │   │   └── middleware.ts   # Auth middleware
│       │   ├── ranks.ts            # Rank tier utilities
│       │   └── characters.ts       # Character data
│       ├── public/
│       │   ├── characters/         # Character stock icon PNGs
│       │   └── ranks/              # Rank tier badge images
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── package.json
│       └── tsconfig.json
│
└── supabase/
    ├── config.toml                  # Supabase local dev config
    ├── migrations/
    │   └── 001_initial_schema.sql   # The full DDL from Section 10
    ├── functions/
    │   ├── verify-slippi/
    │   │   └── index.ts
    │   ├── enrich-player/
    │   │   └── index.ts
    │   └── link-luckystats/
    │       └── index.ts
    └── seed.sql                     # Optional test data
```

---

## 15. Build & Distribution

### Electron Agent

Use `electron-builder` for cross-platform builds:

```yaml
# apps/agent/electron-builder.yml
appId: com.slippifriends.agent
productName: Slippi Friends
copyright: Copyright © 2026

mac:
  category: public.app-category.social-networking
  target:
    - dmg
    - zip
  hardenedRuntime: true
  icon: assets/icon.icns

win:
  target:
    - nsis
  icon: assets/icon.ico

nsis:
  oneClick: true
  perMachine: false

linux:
  target:
    - AppImage
  category: Network

protocols:
  - name: slippi-friends
    role: Viewer
    schemes:
      - slippi-friends

directories:
  output: dist
```

**Build commands:**
```json
{
  "scripts": {
    "dev": "electron .",
    "build": "tsc && electron-builder",
    "build:mac": "tsc && electron-builder --mac",
    "build:win": "tsc && electron-builder --win",
    "build:linux": "tsc && electron-builder --linux"
  }
}
```

You can build Windows and Linux targets from macOS using `electron-builder`'s cross-compilation (it uses Wine for Windows builds on Mac). For CI, GitHub Actions can build all platforms.

### Web App

Standard Vercel deployment:
```bash
cd apps/web
vercel --prod
```

Or connect the GitHub repo to Vercel with the root directory set to `apps/web`.

---

## 16. Development Workflow

### Prerequisites

- Node.js 20+
- npm 9+ (for workspaces)
- Supabase CLI (`npx supabase init`)
- A Slippi installation (for testing the agent)

### Getting Started

```bash
# Clone and install
git clone https://github.com/yourusername/slippi-friends.git
cd slippi-friends
npm install

# Start Supabase locally
npx supabase start

# Run the DB migrations
npx supabase db push

# Start the web app
cd apps/web
npm run dev

# In another terminal, start the Electron agent
cd apps/agent
npm run dev
```

### Environment Variables

**Root `.env` (shared):**
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

**`apps/web/.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**`apps/agent/.env`:**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**`supabase/.env` (for edge functions):**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Testing the Agent Without Slippi

For development, create mock `.slp` files or use sample replay files from the Slippi community. The `slippi-js` library includes test fixtures. You can also simulate the watcher by manually copying `.slp` files into the watched directory.

For presence testing, you can mock the `find-process` call to always return a running Dolphin process.

---

## 17. Future Considerations

### Scaling Presence

Supabase Realtime Presence works well for hundreds to low thousands of concurrent users. If Slippi Friends grows significantly, consider:
- Sharding presence channels by region (e.g., `presence:na`, `presence:eu`)
- Moving to a dedicated presence service (e.g., Ably, PubNub)
- Using the `presence_log` table as the source of truth with polling fallback

### Slippi API Stability

The unofficial GraphQL API could break at any time. Mitigations:
- Aggressive caching (1-hour TTL minimum)
- Graceful degradation — profiles still work without enriched data
- Consider reaching out to Fizzi about official API access or partnership
- The `.slp` file data is always available as a fallback for identity info

### Native Mobile

If there's demand, the web app is the natural candidate for a PWA. The Electron agent is desktop-only (since Slippi is desktop-only), so mobile is purely for social browsing.

### Slippi Launcher Integration

The dream scenario is Slippi officially integrating a friends feature. If that happens, this project could serve as the reference implementation or social layer complement. Building in the open and sharing the spec with the Slippi community early is wise.

### Monetization (if applicable)

- Free for all core features
- Optional "supporter" tier via Ko-fi or similar for badge/cosmetics on profile
- Never gate social features behind payment

---

## Appendix A: Melee Character ID Map

```typescript
export const CHARACTER_MAP: Record<number, string> = {
  0: 'Captain Falcon',
  1: 'Donkey Kong',
  2: 'Fox',
  3: 'Mr. Game & Watch',
  4: 'Kirby',
  5: 'Bowser',
  6: 'Link',
  7: 'Luigi',
  8: 'Mario',
  9: 'Marth',
  10: 'Mewtwo',
  11: 'Ness',
  12: 'Peach',
  13: 'Pikachu',
  14: 'Ice Climbers',
  15: 'Jigglypuff',
  16: 'Samus',
  17: 'Yoshi',
  18: 'Zelda',
  19: 'Sheik',
  20: 'Falco',
  21: 'Young Link',
  22: 'Dr. Mario',
  23: 'Roy',
  24: 'Pichu',
  25: 'Ganondorf',
};
```

## Appendix B: Melee Stage ID Map

```typescript
export const STAGE_MAP: Record<number, string> = {
  2: 'Fountain of Dreams',
  3: 'Pokémon Stadium',
  8: "Yoshi's Story",
  28: 'Dream Land N64',
  31: 'Battlefield',
  32: 'Final Destination',
};
```

## Appendix C: Slippi Rank Tier Calculation

```typescript
interface RankTier {
  name: string;
  tier: number;     // 1-3 within the rank
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
```
