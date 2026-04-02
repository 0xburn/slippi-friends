import * as fs from 'fs';
import * as path from 'path';
import { Menu, Tray, nativeImage } from 'electron';
import { getTrayContext, type PresenceStatus } from './presence';

let tray: Tray | null = null;

type TrayHandlers = {
  onShowWindow: () => void;
  onQuit: () => void;
};

let handlers: TrayHandlers = { onShowWindow: () => {}, onQuit: () => {} };

function iconPath(kind: PresenceStatus): string {
  const base = path.join(__dirname, '..', 'assets');
  const name = kind === 'in-game' ? 'tray-ingame.png' : kind === 'online' ? 'tray-online.png' : 'tray-offline.png';
  return path.join(base, name);
}

function loadIcon(kind: PresenceStatus): Electron.NativeImage {
  for (const p of [iconPath(kind), iconPath('online'), path.join(__dirname, '..', 'assets', 'icon.png')]) {
    try {
      if (fs.existsSync(p)) {
        const img = nativeImage.createFromPath(p);
        return img.resize({ width: 16, height: 16 });
      }
    } catch {}
  }
  return nativeImage.createEmpty();
}

function buildMenu(): Menu {
  const { statusLine } = getTrayContext();

  return Menu.buildFromTemplate([
    { label: `Status: ${statusLine}`, enabled: false },
    { type: 'separator' },
    { label: 'Show friendlies', click: () => handlers.onShowWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => handlers.onQuit() },
  ]);
}

export function createTray(h: TrayHandlers): void {
  handlers = h;
  const img = loadIcon(getTrayContext().icon);
  tray = new Tray(img);
  tray.setToolTip('friendlies');
  tray.setContextMenu(buildMenu());
  tray.on('click', () => handlers.onShowWindow());
}

export function updateTrayStatus(): void {
  if (!tray) return;
  tray.setImage(loadIcon(getTrayContext().icon));
  tray.setContextMenu(buildMenu());
}

export function addRecentOpponent(_code: string, _name: string): void {}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
