export const CHARACTER_MAP: Record<number, string> = {
  0: 'Captain Falcon', 1: 'Donkey Kong', 2: 'Fox', 3: 'Mr. Game & Watch',
  4: 'Kirby', 5: 'Bowser', 6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth',
  10: 'Mewtwo', 11: 'Ness', 12: 'Peach', 13: 'Pikachu', 14: 'Ice Climbers',
  15: 'Jigglypuff', 16: 'Samus', 17: 'Yoshi', 18: 'Zelda', 19: 'Sheik',
  20: 'Falco', 21: 'Young Link', 22: 'Dr. Mario', 23: 'Roy', 24: 'Pichu', 25: 'Ganondorf',
};

export const CHARACTER_SHORT_NAMES: Record<number, string> = {
  0: 'Falcon', 1: 'DK', 2: 'Fox', 3: 'G&W', 4: 'Kirby', 5: 'Bowser',
  6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth', 10: 'Mewtwo', 11: 'Ness',
  12: 'Peach', 13: 'Pikachu', 14: 'ICs', 15: 'Puff', 16: 'Samus',
  17: 'Yoshi', 18: 'Zelda', 19: 'Sheik', 20: 'Falco', 21: 'YLink',
  22: 'Doc', 23: 'Roy', 24: 'Pichu', 25: 'Ganon',
};

// l7stats A#.png uses alphabetical order: A1=Bowser, A2=Falcon, A3=DK, ...
const SLIPPI_ID_TO_ALPHA: Record<number, number> = {
  0: 2,   // Captain Falcon
  1: 3,   // Donkey Kong
  2: 6,   // Fox
  3: 16,  // Mr. Game & Watch
  4: 10,  // Kirby
  5: 1,   // Bowser
  6: 11,  // Link
  7: 12,  // Luigi
  8: 13,  // Mario
  9: 14,  // Marth
  10: 15, // Mewtwo
  11: 17, // Ness
  12: 18, // Peach
  13: 20, // Pikachu
  14: 8,  // Ice Climbers
  15: 9,  // Jigglypuff
  16: 22, // Samus
  17: 24, // Yoshi
  18: 26, // Zelda
  19: 23, // Sheik
  20: 5,  // Falco
  21: 25, // Young Link
  22: 4,  // Dr. Mario
  23: 21, // Roy
  24: 19, // Pichu
  25: 7,  // Ganondorf
};

export function getCharacterImagePath(id: number): string {
  const alphaId = SLIPPI_ID_TO_ALPHA[id];
  if (alphaId == null) return '';
  return `/characters/A${alphaId}.png`;
}

export function getCharacterName(id: number): string { return CHARACTER_MAP[id] ?? 'Unknown'; }
export function getCharacterShortName(id: number): string { return CHARACTER_SHORT_NAMES[id] ?? '???'; }

export const STAGE_MAP: Record<number, string> = {
  2: 'Fountain of Dreams', 3: 'Pokemon Stadium', 8: "Yoshi's Story",
  28: 'Dream Land N64', 31: 'Battlefield', 32: 'Final Destination',
};
