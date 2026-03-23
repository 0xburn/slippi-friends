import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const DOLPHIN_PROCESS_NAMES = [
  'Slippi Dolphin',
  'dolphin-emu',
  'Dolphin.exe',
  'AppRun',
] as const;

export const PRESENCE_POLL_INTERVAL = 15_000;
export const REPLAY_ACTIVE_THRESHOLD = 30_000;
export const APP_PROTOCOL = 'slippi-friends';

export function getSlippiUserJsonPaths(): string[] {
  const home = os.homedir();
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    const appData = path.join(home, 'AppData');
    candidates.push(
      path.join(appData, 'Roaming', 'com.project-slippi.dolphin', 'Slippi', 'user.json'),
      path.join(appData, 'Roaming', 'Slippi Launcher', 'netplay', 'user.json'),
      path.join(appData, 'Local', 'com.project-slippi.dolphin', 'Slippi', 'user.json'),
      path.join(appData, 'Local', 'Programs', 'slippi-launcher', 'resources', 'app.asar.unpacked', 'dolphin', 'user.json'),
      path.join(appData, 'Roaming', 'Slippi Desktop App', 'dolphin', 'user.json'),
    );
  } else if (process.platform === 'darwin') {
    const appSupport = path.join(home, 'Library', 'Application Support');
    candidates.push(
      path.join(appSupport, 'com.project-slippi.dolphin', 'Slippi', 'user.json'),
      path.join(appSupport, 'Slippi Launcher', 'netplay', 'user.json'),
      path.join(appSupport, 'Slippi Desktop App', 'dolphin', 'user.json'),
    );
  } else {
    candidates.push(
      path.join(home, '.config', 'com.project-slippi.dolphin', 'Slippi', 'user.json'),
      path.join(home, '.config', 'SlippiOnline', 'user.json'),
      path.join(home, '.config', 'Slippi Launcher', 'netplay', 'user.json'),
    );
  }

  // Fallback: scan common parent dirs for any user.json with a connectCode
  const scanned = scanForSlippiUserJson();
  for (const p of scanned) {
    if (!candidates.includes(p)) candidates.push(p);
  }

  return candidates;
}

function scanForSlippiUserJson(): string[] {
  const found: string[] = [];
  const home = os.homedir();
  let searchDirs: string[] = [];

  if (process.platform === 'win32') {
    searchDirs = [
      path.join(home, 'AppData', 'Roaming'),
      path.join(home, 'AppData', 'Local'),
    ];
  } else if (process.platform === 'darwin') {
    searchDirs = [path.join(home, 'Library', 'Application Support')];
  } else {
    searchDirs = [path.join(home, '.config')];
  }

  for (const dir of searchDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir)) {
        if (!entry.toLowerCase().includes('slippi') && !entry.toLowerCase().includes('dolphin')) continue;
        const candidate = findUserJsonInDir(path.join(dir, entry), 3);
        if (candidate) found.push(candidate);
      }
    } catch { /* ignore permission errors */ }
  }
  return found;
}

function findUserJsonInDir(dir: string, maxDepth: number): string | null {
  if (maxDepth <= 0) return null;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'user.json' && entry.isFile()) {
        const full = path.join(dir, entry.name);
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf8'));
          if (data.connectCode && data.uid) return full;
        } catch { /* not a valid slippi user.json */ }
      }
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const result = findUserJsonInDir(path.join(dir, entry.name), maxDepth - 1);
        if (result) return result;
      }
    }
  } catch { /* ignore */ }
  return null;
}

export function getDefaultReplayDir(): string {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(home, 'Documents', 'Slippi');
  }
  return path.join(home, 'Slippi');
}

function parseEnvLines(content: string): void {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadAppDotEnv(appRoot?: string): void {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  if (appRoot) {
    candidates.unshift(path.join(appRoot, '.env'));
  }
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        parseEnvLines(fs.readFileSync(p, 'utf8'));
        break;
      }
    } catch {
      /* ignore */
    }
  }
}

loadAppDotEnv();
