import { app } from 'electron';
import * as fs from 'fs';

const Store = require('electron-store');
import { getDefaultReplayDir } from './config';

export type AgentSettings = {
  replayDir: string;
  autoLaunch: boolean;
  showNotifications: boolean;
  setupComplete: boolean;
};

const store = new Store({ name: 'slippi-friends-settings' });

export function isSetupComplete(): boolean {
  return Boolean(store.get('setupComplete'));
}

export function getSettings(): AgentSettings {
  try {
    return {
      replayDir: (store.get('replayDir') as string | undefined) ?? getDefaultReplayDir(),
      autoLaunch: Boolean(store.get('autoLaunch')),
      showNotifications: store.get('showNotifications') !== false,
      setupComplete: isSetupComplete(),
    };
  } catch {
    return { replayDir: getDefaultReplayDir(), autoLaunch: false, showNotifications: true, setupComplete: false };
  }
}

export function updateSettings(partial: Partial<AgentSettings>): AgentSettings {
  try {
    const cur = getSettings();
    const next = { ...cur, ...partial };
    if (partial.replayDir !== undefined) store.set('replayDir', next.replayDir);
    if (partial.autoLaunch !== undefined) {
      store.set('autoLaunch', next.autoLaunch);
      app.setLoginItemSettings({ openAtLogin: next.autoLaunch, openAsHidden: true });
    }
    if (partial.showNotifications !== undefined) store.set('showNotifications', next.showNotifications);
    if (partial.setupComplete !== undefined) store.set('setupComplete', next.setupComplete);
    return next;
  } catch {
    return getSettings();
  }
}

export function detectReplayDir(): string {
  const dir = getDefaultReplayDir();
  try { if (fs.existsSync(dir)) return dir; } catch {}
  return dir;
}
