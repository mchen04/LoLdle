import { fetchChampions, type DbChampionRow } from '../utils/db'
import type { Champion, GameMode } from '../types/champion'

let champions: Champion[] = []
let loaded = false

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
    abilities: (row.abilities || []).map(a => ({
      name: a.name,
      icon: a.icon_url,
      slot: a.slot as 'P' | 'Q' | 'W' | 'E' | 'R',
    })),
    skins: (row.skins || []).map(s => ({
      id: s.id,
      name: s.name,
      splash: s.splash_url,
    })),
  }
}

export async function loadChampions(): Promise<Champion[]> {
  if (loaded) return champions

  try {
    const rows = await fetchChampions()
    champions = rows.map(mapDbChampion)
  } catch (err) {
    console.warn('Failed to load champions:', err)
  }
  loaded = true
  return champions
}

export function getChampions(): Champion[] {
  return champions
}

export function getChampionById(id: string): Champion | undefined {
  return champions.find(c => c.id === id)
}

export function getChampionByName(name: string): Champion | undefined {
  return champions.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function getRandomChampion(exclude?: string[], mode?: GameMode): Champion {
  let pool = exclude
    ? champions.filter(c => !exclude.includes(c.id))
    : champions

  if (mode === 'quote') {
    pool = pool.filter(c => !!c.quote)
  }
  if (mode === 'emoji') {
    pool = pool.filter(c => !!c.emojiClue)
  }
  if (mode === 'spellName' || mode === 'allAbilities') {
    pool = pool.filter(c => c.abilities.length > 0)
  }
  if (mode === 'passive') {
    pool = pool.filter(c => c.abilities.some(a => a.slot === 'P'))
  }
  if (mode === 'feet') {
    pool = pool.filter(c => FEET_CHAMPIONS.has(c.id))
  }
  if (mode === 'warped') {
    pool = pool.filter(c => !!c.splash)
  }
  if (mode === 'pixel' || mode === 'colorShift' || mode === 'zoomedIcon') {
    pool = pool.filter(c => !!c.icon)
  }
  if (mode === 'skinName') {
    pool = pool.filter(c => c.skins.length > 0)
  }
  if (mode === 'backwardsQuote') {
    pool = pool.filter(c => !!c.quote && c.quote.split(' ').length >= 3)
  }

  if (pool.length === 0) {
    pool = [...champions]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

const MAX_SEARCH_RESULTS = 8

export function searchChampions(query: string): Champion[] {
  if (!query) return []
  const q = query.toLowerCase()
  return champions.filter(c => c.name.toLowerCase().includes(q)).slice(0, MAX_SEARCH_RESULTS)
}

export function getWrongGuesses(guessIds: string[], targetId: string): Champion[] {
  return guessIds
    .filter(id => id !== targetId)
    .map(id => getChampionById(id))
    .filter((c): c is Champion => c !== undefined)
}
