// Single source of truth: scripts/lib/champion-maps.json
// Keep in sync — or generate this file from the JSON at build time.

export interface UniverseChampion {
  races?: { name: string; slug: string }[];
  roles?: { name: string }[];
  "associated-faction-slug"?: string;
  biography?: { quote?: string; "quote-author"?: string };
}

export const FACTION_MAP: Record<string, string> = {
  demacia: "Demacia", noxus: "Noxus", ionia: "Ionia",
  shurima: "Shurima", freljord: "Freljord", zaun: "Zaun",
  piltover: "Piltover", "shadow-isles": "Shadow Isles", void: "The Void",
  "mount-targon": "Targon", bilgewater: "Bilgewater", "bandle-city": "Bandle City",
  ixtal: "Ixtal", unaffiliated: "Runeterra", camavor: "Camavor",
  icathia: "Icathia", "blessed-isles": "Blessed Isles",
};

export const ROLE_EMOJI: Record<string, string> = {
  Fighter: "⚔️", Mage: "🔮", Tank: "🛡️", Assassin: "🗡️",
  Marksman: "🏹", Support: "💚",
};

export const RACE_EMOJI: Record<string, string> = {
  Darkin: "😈", Yordle: "🐹", Vastaya: "🦊", Void: "🌀",
  Celestial: "⭐", Undead: "💀", Spirit: "👻", Dragon: "🐉",
  Human: "👤", Ascended: "☀️", Golem: "🗿", Demon: "👹",
  "God-Warrior": "⚡",
};

export const REGION_EMOJI: Record<string, string> = {
  Demacia: "⚜️", Noxus: "🔴", Ionia: "🌸", Freljord: "❄️",
  "Shadow Isles": "👻", "The Void": "🟣", Shurima: "🏜️",
  Piltover: "⚙️", Zaun: "🧪", Bilgewater: "🏴‍☠️", Targon: "🏔️",
  "Bandle City": "🍄", Ixtal: "🌿", Runeterra: "🌍",
};

export function detectGender(loreText: string): string {
  if (!loreText) return "Male";
  const lower = loreText.toLowerCase();
  const she = (lower.match(/\b(she|her|hers|herself)\b/g) || []).length;
  const he = (lower.match(/\b(he|him|his|himself)\b/g) || []).length;
  const they = (lower.match(/\b(they|them|their|themself)\b/g) || []).length;
  if (they > she && they > he) return "Non-binary";
  if (she > he) return "Female";
  return "Male";
}

export function generateEmoji(
  roles: string[],
  species: string[],
  region: string
): string {
  const parts: string[] = [];
  const roleHit = roles.map((r) => ROLE_EMOJI[r]).filter(Boolean);
  if (roleHit.length) parts.push(roleHit[0]);
  const specHit = species.map((s) => RACE_EMOJI[s]).filter(Boolean);
  if (specHit.length) parts.push(specHit[0]);
  const regHit = REGION_EMOJI[region];
  if (regHit) parts.push(regHit);
  if (parts.length < 3) parts.push("❓");
  return parts.slice(0, 4).join("");
}
