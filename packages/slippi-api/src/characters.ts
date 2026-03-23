export const CHARACTER_MAP: Record<number, string> = {
  0: "Captain Falcon",
  1: "Donkey Kong",
  2: "Fox",
  3: "Mr. Game & Watch",
  4: "Kirby",
  5: "Bowser",
  6: "Link",
  7: "Luigi",
  8: "Mario",
  9: "Marth",
  10: "Mewtwo",
  11: "Ness",
  12: "Peach",
  13: "Pikachu",
  14: "Ice Climbers",
  15: "Jigglypuff",
  16: "Samus",
  17: "Yoshi",
  18: "Zelda",
  19: "Sheik",
  20: "Falco",
  21: "Young Link",
  22: "Dr. Mario",
  23: "Roy",
  24: "Pichu",
  25: "Ganondorf",
};

export const CHARACTER_SHORT_NAMES: Record<number, string> = {
  0: "Falcon",
  1: "DK",
  2: "Fox",
  3: "G&W",
  4: "Kirby",
  5: "Bowser",
  6: "Link",
  7: "Luigi",
  8: "Mario",
  9: "Marth",
  10: "Mewtwo",
  11: "Ness",
  12: "Peach",
  13: "Pikachu",
  14: "ICs",
  15: "Puff",
  16: "Samus",
  17: "Yoshi",
  18: "Zelda",
  19: "Sheik",
  20: "Falco",
  21: "YLink",
  22: "Doc",
  23: "Roy",
  24: "Pichu",
  25: "Ganon",
};

export function getCharacterName(id: number): string {
  return CHARACTER_MAP[id] ?? "Unknown";
}

export function getCharacterShortName(id: number): string {
  return CHARACTER_SHORT_NAMES[id] ?? "Unknown";
}
