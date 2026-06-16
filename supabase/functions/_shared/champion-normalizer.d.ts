export interface NormalizedAbility {
  name: string;
  icon: string;
  slot: string;
}

export interface NormalizedSkin {
  id: string;
  name: string;
  splash: string;
}

export interface NormalizedChampion {
  id: string;
  name: string;
  title: string;
  gender: string;
  positions: string[];
  species: string[];
  resource: string;
  rangeType: string;
  regions: string[];
  releaseYear: number;
  icon: string;
  splash: string;
  abilities: NormalizedAbility[];
  skins: NormalizedSkin[];
  quote: string;
  emojiClue: string;
}

export interface ResolveChampionDataInput {
  id: string;
  ddDetail: {
    name: string;
    title: string;
    lore?: string;
    blurb?: string;
    tags?: string[];
    partype?: string;
    image: { full: string };
    passive?: { name: string; image: { full: string } };
    spells?: { name: string; image: { full: string } }[];
    skins?: { num: number; name: string }[];
    stats?: { attackrange?: number };
  };
  meraki: { releaseDate?: string; positions?: string | string[]; attackType?: string } | null;
  supplement: Record<string, unknown>;
  universe: {
    races?: { name: string }[];
    "associated-faction-slug"?: string;
    biography?: { quote?: string };
  } | null;
  ddBase: string;
  factionMap: Record<string, string>;
  generateEmoji: (roles: string[], species: string[], region: string) => string;
}

export function detectGender(loreText: string): string;
export function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]>;
export function createEmojiGenerator(maps: {
  roleEmoji: Record<string, string>;
  raceEmoji: Record<string, string>;
  regionEmoji: Record<string, string>;
}): (roles: string[], species: string[], region: string) => string;
export function resolveChampionData(input: ResolveChampionDataInput): {
  champion: NormalizedChampion;
  skinCandidates: NormalizedSkin[];
};
