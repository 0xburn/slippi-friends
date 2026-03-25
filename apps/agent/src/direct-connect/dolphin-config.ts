/**
 * Dolphin configuration helpers for direct connect.
 *
 * Resolves the real Dolphin User directory and the Slippi config directory.
 * Injects a connect code into Slippi's direct-codes.json so it appears as
 * the first autocomplete suggestion on the in-game code entry screen.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Dolphin User directory resolution
// ---------------------------------------------------------------------------

function slippiUserDirectoryCandidates(): string[] {
  const home = os.homedir();
  return process.platform === 'win32'
    ? [
        path.join(home, 'AppData', 'Roaming', 'com.project-slippi.dolphin', 'netplay', 'User'),
        path.join(home, 'AppData', 'Roaming', 'Slippi Launcher', 'netplay', 'User'),
      ]
    : process.platform === 'darwin'
      ? [
          path.join(home, 'Library', 'Application Support', 'com.project-slippi.dolphin', 'netplay', 'User'),
          path.join(home, 'Library', 'Application Support', 'Slippi Launcher', 'netplay', 'User'),
        ]
      : [
          path.join(home, '.config', 'com.project-slippi.dolphin', 'netplay', 'User'),
          path.join(home, '.config', 'Slippi Launcher', 'netplay', 'User'),
          path.join(home, '.config', 'SlippiOnline'),
        ];
}

export function getDolphinUserDir(): string | null {
  for (const dir of slippiUserDirectoryCandidates()) {
    if (fs.existsSync(path.join(dir, 'Config'))) return dir;
  }
  for (const dir of slippiUserDirectoryCandidates()) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slippi config directory (where direct-codes.json + user.json live)
// ---------------------------------------------------------------------------

function slippiConfigDirCandidates(): string[] {
  const home = os.homedir();
  return process.platform === 'win32'
    ? [
        path.join(home, 'AppData', 'Roaming', 'com.project-slippi.dolphin', 'Slippi'),
        path.join(home, 'AppData', 'Roaming', 'Slippi Launcher', 'Slippi'),
      ]
    : process.platform === 'darwin'
      ? [
          path.join(home, 'Library', 'Application Support', 'com.project-slippi.dolphin', 'Slippi'),
          path.join(home, 'Library', 'Application Support', 'Slippi Launcher', 'Slippi'),
        ]
      : [
          path.join(home, '.config', 'com.project-slippi.dolphin', 'Slippi'),
          path.join(home, '.config', 'Slippi Launcher', 'Slippi'),
          path.join(home, '.config', 'SlippiOnline'),
        ];
}

function getSlippiConfigDir(): string | null {
  for (const dir of slippiConfigDirCandidates()) {
    if (fs.existsSync(dir)) return dir;
  }
  return slippiConfigDirCandidates()[0] ?? null;
}

// ---------------------------------------------------------------------------
// Direct code injection
// ---------------------------------------------------------------------------

function toFullwidth(str: string): string {
  return [...str].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 0x21 && code <= 0x7E) return String.fromCharCode(code + 0xFEE0);
    return ch;
  }).join('');
}

/**
 * Write a connect code as the most-recent entry in Slippi's direct-codes.json.
 * Dolphin reads this file to populate autocomplete on the code entry screen.
 * Codes are stored in fullwidth Unicode (e.g. MATW#444 → ＭＡＴＷ＃４４４).
 */
export function injectDirectCode(connectCode: string): void {
  const slippiDir = getSlippiConfigDir();
  if (!slippiDir) {
    console.warn('[direct-connect] Cannot find Slippi config directory — skipping code injection');
    return;
  }

  const filePath = path.join(slippiDir, 'direct-codes.json');
  const fullwidthCode = toFullwidth(connectCode.toUpperCase().trim());
  const now = Math.floor(Date.now() / 1000);

  let codes: { connectCode: string; lastPlayed: number }[] = [];
  if (fs.existsSync(filePath)) {
    try {
      codes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {}
  }

  codes = codes.filter((c) => c.connectCode !== fullwidthCode);
  codes.unshift({ connectCode: fullwidthCode, lastPlayed: now });

  fs.mkdirSync(slippiDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(codes));
  console.log(`[direct-connect] Injected ${connectCode} as most recent in direct-codes.json`);
}
