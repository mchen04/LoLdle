import { fetchChampions, type DbChampionRow } from '../utils/db'
import type { Champion, GameMode } from '../types/champion'

let champions: Champion[] = []
let loaded = false
let loadPromise: Promise<Champion[]> | null = null
let championsById = new Map<string, Champion>()
let championsByName = new Map<string, Champion>()
let searchIndex: { champion: Champion; normalizedName: string }[] = []
let modePools = new Map<GameMode, Champion[]>()

const ABILITY_ORDER = new Map([
  ['P', 0],
  ['Q', 1],
  ['W', 2],
  ['E', 3],
  ['R', 4],
])

const FEET_CHAMPIONS = new Set([
  'Akali', 'Akshan', 'Alistar', 'Amumu', 'Ashe', 'Azir', 'Blitzcrank',
  'Brand', 'Briar', 'Caitlyn', 'Camille', 'Diana', 'Elise', 'Evelynn',
  'Fiddlesticks', 'Fizz', 'Galio', 'Gnar', 'Gwen', 'Hecarim', 'Irelia',
  'JarvanIV', 'Jhin', 'Kennen', 'Khazix', 'Kindred', 'Kled', 'LeeSin',
  'Malzahar', 'MasterYi', 'Milio', 'Morgana', 'Nautilus', 'Neeko',
  'Nidalee', 'Orianna', 'Poppy', 'Shaco', 'Smolder', 'Sylas', 'Syndra',
  'Teemo', 'Thresh', 'Trundle', 'Twitch', 'Varus', 'Vex', 'Vi', 'Viktor',
  'XinZhao', 'Zed', 'Ziggs', 'Zoe', 'Zyra', 'Yunara',
])

function mapDbChampion(row: DbChampionRow): Champion {
  const abilities = [...(row.abilities || [])].sort((a, b) => {
    return (ABILITY_ORDER.get(a.slot) ?? 5) - (ABILITY_ORDER.get(b.slot) ?? 5)
  })
  const skins = [...(row.skins || [])].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

  return {
    id: row.id,
    name: row.name,
    title: row.title,
    gender: row.gender,
    positions: row.positions,
    species: row.species,
    resource: row.resource,
    rangeType: row.range_type,
    regions: row.regions,
    releaseYear: row.release_year,
    icon: row.icon_url,
    splash: row.splash_url,
    quote: row.quote,
    emojiClue: row.emoji_clue,
    abilities: abilities.map(a => ({
      name: a.name,
      icon: a.icon_url,
      slot: a.slot as 'P' | 'Q' | 'W' | 'E' | 'R',
    })),
    skins: skins.map(s => ({
      id: s.id,
      name: s.name,
      splash: s.splash_url,
    })),
  }
}

const MODE_FILTERS: Partial<Record<GameMode, (champion: Champion) => boolean>> = {
  quote: champion => !!champion.quote,
  emoji: champion => !!champion.emojiClue,
  spellName: champion => champion.abilities.length > 0,
  allAbilities: champion => champion.abilities.length > 0,
  passive: champion => champion.abilities.some(ability => ability.slot === 'P'),
  feet: champion => FEET_CHAMPIONS.has(champion.id),
  warped: champion => !!champion.splash,
  pixel: champion => !!champion.icon,
  colorShift: champion => !!champion.icon,
  zoomedIcon: champion => !!champion.icon,
  skinName: champion => champion.skins.length > 0,
  backwardsQuote: champion => !!champion.quote && champion.quote.split(' ').length >= 3,
}

function indexChampions(nextChampions: Champion[]) {
  champions = nextChampions
  championsById = new Map(nextChampions.map(champion => [champion.id, champion]))
  championsByName = new Map(nextChampions.map(champion => [champion.name.toLowerCase(), champion]))
  searchIndex = nextChampions.map(champion => ({
    champion,
    normalizedName: champion.name.toLowerCase(),
  }))
  modePools = new Map(
    Object.entries(MODE_FILTERS).map(([mode, filter]) => [
      mode as GameMode,
      nextChampions.filter(filter),
    ])
  )
}

export async function loadChampions(): Promise<Champion[]> {
  if (loaded) return champions
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const rows = await fetchChampions()
    if (rows.length === 0) {
      throw new Error('No champion data returned from the configured database')
    }

    indexChampions(rows.map(mapDbChampion))
    loaded = true
    return champions
  })()

  try {
    return await loadPromise
  } catch (err) {
    loadPromise = null
    loaded = false
    throw err
  }
}

export function getChampions(): Champion[] {
  return champions
}

export function getChampionById(id: string): Champion | undefined {
  return championsById.get(id)
}

export function getChampionByName(name: string): Champion | undefined {
  return championsByName.get(name.toLowerCase())
}

export function getRandomChampion(exclude?: string[], mode?: GameMode): Champion {
  const basePool = mode ? (modePools.get(mode) ?? champions) : champions
  let pool = basePool
  if (exclude?.length) {
    const excludedIds = new Set(exclude)
    pool = basePool.filter(champion => !excludedIds.has(champion.id))
  }
  if (pool.length === 0) {
    pool = champions
  }
  if (pool.length === 0) throw new Error('No champions loaded')
  return pool[Math.floor(Math.random() * pool.length)]
}

const MAX_SEARCH_RESULTS = 8

export function searchChampions(query: string, excludedIds?: ReadonlySet<string>): Champion[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: Champion[] = []
  for (const entry of searchIndex) {
    if (excludedIds?.has(entry.champion.id) || !entry.normalizedName.includes(q)) continue

    results.push(entry.champion)
    if (results.length === MAX_SEARCH_RESULTS) break
  }
  return results
}

export function getWrongGuesses(guessIds: string[], targetId: string): Champion[] {
  return guessIds
    .filter(id => id !== targetId)
    .map(id => championsById.get(id))
    .filter((c): c is Champion => c !== undefined)
}
