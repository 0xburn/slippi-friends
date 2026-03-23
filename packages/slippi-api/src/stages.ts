export const STAGE_MAP: Record<number, string> = {
  2: "Fountain of Dreams",
  3: "Pokémon Stadium",
  8: "Yoshi's Story",
  28: "Dream Land N64",
  31: "Battlefield",
  32: "Final Destination",
};

export function getStageName(id: number): string {
  return STAGE_MAP[id] ?? "Unknown";
}
