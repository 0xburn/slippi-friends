/**
 * Finds, launches, and kills Slippi Dolphin.
 *
 * Dolphin executable is located via known install paths.
 * Melee ISO path is read from Dolphin.ini (LastFilename / ISOPath0).
 */

import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getDolphinUserDir } from './dolphin-config';
import { DOLPHIN_PROCESS_NAMES } from '../config';

const find = require('find-process') as (
  type: 'name',
  name: string,
  strict?: boolean,
) => Promise<Array<{ name: string; pid: number }>>;

function scanForExe(dir: string, pattern: RegExp): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => pattern.test(f))
      .map((f) => path.join(dir, f));
  } catch { return []; }
}

function findAppImages(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => /slippi.*\.appimage$/i.test(f))
      .map((f) => path.join(dir, f));
  } catch { return []; }
}

export function getDolphinExePath(): string | null {
  const home = os.homedir();

  const launcherDir = process.platform === 'win32'
    ? path.join(home, 'AppData', 'Roaming', 'Slippi Launcher')
    : process.platform === 'darwin'
      ? path.join(home, 'Library', 'Application Support', 'Slippi Launcher')
      : path.join(home, '.config', 'Slippi Launcher');

  const candidates: string[] =
    process.platform === 'win32'
      ? [
          // Mainline (promoted to stable or beta)
          ...scanForExe(path.join(launcherDir, 'netplay'), /dolphin\.exe$/i),
          ...scanForExe(path.join(launcherDir, 'netplay-beta'), /dolphin\.exe$/i),
          // Legacy explicit paths
          path.join(launcherDir, 'netplay', 'Slippi Dolphin.exe'),
          path.join(home, 'AppData', 'Local', 'Programs', 'Slippi Launcher', 'netplay', 'Slippi Dolphin.exe'),
        ]
      : process.platform === 'darwin'
        ? [
            // Mainline (Slippi_Dolphin.app with underscores)
            path.join(launcherDir, 'netplay', 'Slippi_Dolphin.app', 'Contents', 'MacOS', 'Slippi_Dolphin'),
            path.join(launcherDir, 'netplay-beta', 'Slippi_Dolphin.app', 'Contents', 'MacOS', 'Slippi_Dolphin'),
            // Ishiiruka (Slippi Dolphin.app with spaces)
            path.join(launcherDir, 'netplay', 'Slippi Dolphin.app', 'Contents', 'MacOS', 'Slippi Dolphin'),
            path.join(launcherDir, 'netplay-beta', 'Slippi Dolphin.app', 'Contents', 'MacOS', 'Slippi Dolphin'),
            '/Applications/Slippi Dolphin.app/Contents/MacOS/Slippi Dolphin',
          ]
        : [
            // Slippi Launcher managed (Ishiiruka + mainline)
            path.join(launcherDir, 'netplay', 'Slippi_Dolphin'),
            path.join(launcherDir, 'netplay', 'squashfs-root', 'usr', 'bin', 'dolphin-emu'),
            path.join(launcherDir, 'netplay-beta', 'squashfs-root', 'usr', 'bin', 'dolphin-emu'),
            // AUR / system packages
            '/usr/bin/slippi-dolphin',
            '/usr/bin/dolphin-emu',
            '/usr/local/bin/slippi-dolphin',
            '/usr/local/bin/dolphin-emu',
            // User-local installs
            path.join(home, '.local', 'bin', 'Slippi_Dolphin'),
            path.join(home, '.local', 'bin', 'slippi-dolphin'),
            // Flatpak
            path.join(home, '.var', 'app', 'io.github.nicoboss.dolphin-slippi', 'bin', 'dolphin-emu'),
            // AppImage scan fallback (netplay + netplay-beta)
            ...findAppImages(path.join(launcherDir, 'netplay')),
            ...findAppImages(path.join(launcherDir, 'netplay-beta')),
          ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getSlippiLauncherIsoPath(): string | null {
  const home = os.homedir();
  const settingsPaths = process.platform === 'win32'
    ? [path.join(home, 'AppData', 'Roaming', 'Slippi Launcher', 'Settings')]
    : process.platform === 'darwin'
      ? [path.join(home, 'Library', 'Application Support', 'Slippi Launcher', 'Settings')]
      : [path.join(home, '.config', 'Slippi Launcher', 'Settings')];

  for (const p of settingsPaths) {
    try {
      if (!fs.existsSync(p)) continue;
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const isoPath = data?.settings?.isoPath;
      if (isoPath && typeof isoPath === 'string' && fs.existsSync(isoPath)) {
        console.log(`[dolphin-launcher] ISO from Slippi Launcher settings: ${isoPath}`);
        return isoPath;
      }
    } catch { /* ignore */ }
  }
  return null;
}

function readIniValue(content: string, key: string): string | null {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith(key)) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const val = trimmed.slice(eq + 1).trim();
        if (val && fs.existsSync(val)) return val;
      }
    }
  }
  return null;
}

const MELEE_PATTERNS = /melee|gale01|ssbm/i;

export function getMeleeIsoPath(): string | null {
  // Best source: Slippi Launcher's configured ISO path
  const launcherIso = getSlippiLauncherIsoPath();
  if (launcherIso) return launcherIso;

  const userDir = getDolphinUserDir();
  if (!userDir) return null;

  const iniPath = path.join(userDir, 'Config', 'Dolphin.ini');
  if (!fs.existsSync(iniPath)) return null;
  const content = fs.readFileSync(iniPath, 'utf8');

  // Prefer ISOPath0 (configured game directory entry)
  const isoPath0 = readIniValue(content, 'ISOPath0');
  if (isoPath0) return isoPath0;

  // LastFilename only if it looks like Melee (not Uncle Punch, training packs, etc.)
  const lastFile = readIniValue(content, 'LastFilename');
  if (lastFile && MELEE_PATTERNS.test(path.basename(lastFile))) return lastFile;

  // Last resort: return LastFilename even if it doesn't match, better than nothing
  if (lastFile) {
    console.warn(`[dolphin-launcher] LastFilename doesn't look like Melee: ${lastFile}`);
    return lastFile;
  }

  return null;
}

export async function isDolphinRunning(): Promise<boolean> {
  try {
    const results = await Promise.all(
      DOLPHIN_PROCESS_NAMES.map((name) => find('name', name, false).catch(() => [] as any[])),
    );
    for (const r of results) {
      if (r.length > 0) return true;
    }
  } catch {}
  return false;
}

export async function getDolphinPids(): Promise<number[]> {
  const pids: number[] = [];
  try {
    const results = await Promise.all(
      DOLPHIN_PROCESS_NAMES.map((name) => find('name', name, false).catch(() => [] as any[])),
    );
    for (const r of results) {
      for (const proc of r) pids.push(proc.pid);
    }
  } catch {}
  return [...new Set(pids)];
}

export async function killDolphin(): Promise<void> {
  const pids = await getDolphinPids();
  if (pids.length === 0) return;

  console.log(`[dolphin-launcher] Killing Dolphin PIDs: ${pids.join(', ')}`);
  for (const pid of pids) {
    try { process.kill(pid, 'SIGTERM'); } catch {}
  }

  // Wait for processes to exit (up to 5 seconds)
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    const remaining = await getDolphinPids();
    if (remaining.length === 0) {
      console.log('[dolphin-launcher] Dolphin stopped');
      return;
    }
  }

  // Force kill if still running
  const stubborn = await getDolphinPids();
  for (const pid of stubborn) {
    try { process.kill(pid, 'SIGKILL'); } catch {}
  }
  await sleep(500);
  console.log('[dolphin-launcher] Dolphin force-killed');
}

export function launchDolphin(overrideUserDir?: string): void {
  const exePath = getDolphinExePath();
  if (!exePath) throw new Error('Cannot find Slippi Dolphin executable');

  const isoPath = getMeleeIsoPath();
  if (!isoPath) throw new Error('Cannot find Melee ISO (check Dolphin.ini LastFilename)');

  const userDir = overrideUserDir ?? getDolphinUserDir();

  const args = ['-e', isoPath];
  if (userDir) {
    args.push('-u', userDir);
  }

  console.log(`[dolphin-launcher] Launching: "${exePath}" ${args.map(a => `"${a}"`).join(' ')}`);

  // macOS: use execFile to avoid spawn deadlocks in Dolphin's rendering
  // (matches how the Slippi Launcher handles this)
  if (process.platform === 'darwin') {
    const child = execFile(exePath, args, { maxBuffer: 100 * 1000 * 1000 });
    child.unref();
  } else {
    const child = spawn(exePath, args, { detached: true, stdio: 'ignore' });
    child.unref();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
