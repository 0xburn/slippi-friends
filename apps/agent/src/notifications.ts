import { Notification } from 'electron';

const { characters } = require('@slippi/slippi-js') as {
  characters: typeof import('@slippi/slippi-js').characters;
};

function characterLabel(characterId: number): string {
  try {
    const name = characters.getCharacterName(characterId);
    if (name) return name;
  } catch {
    /* ignore */
  }
  return `Character ${characterId}`;
}

export function showOpponentNotification(
  opponentCode: string,
  opponentName: string,
  characterId: number,
): void {
  try {
    if (!Notification.isSupported()) return;
    const charName = characterLabel(characterId);
    const n = new Notification({
      title: 'Slippi Friends',
      body: `${opponentName || opponentCode} (${opponentCode}) — ${charName}`,
    });
    n.show();
  } catch (e) {
    console.error('showOpponentNotification failed', e);
  }
}
