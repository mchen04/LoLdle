import { supabase } from '../utils/supabase'
import type { Champion, GameMode } from '../types/champion'

let champions: Champion[] = []
let loaded = false

interface DbChampion {
  id: string
  name: string
  title: string
  gender: string
  positions: string[]
  species: string[]
  resource: string
  range_type: string
  regions: string[]
  release_year: number
  icon_url: string
  splash_url: string
  quote: string
  emoji_clue: string
  abilities: { name: string; icon_url: string; slot: string }[]
  skins: { id: string; name: string; splash_url: string }[]
}

function mapDbChampion(row: DbChampion): Champion {
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

  if (!supabase) {
    console.warn('Supabase not configured, no champion data available')
    loaded = true
    return champions
  }

  const { data, error } = await supabase
    .from('champions')
    .select('*, abilities(*), skins(*)')

  if (error) {
    console.warn('Failed to load champions from Supabase:', error.message)
    loaded = true
    return champions
  }

  champions = (data as DbChampion[]).map(mapDbChampion)
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
