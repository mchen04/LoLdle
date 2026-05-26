import championsData from './champions.json'
import type { Champion, GameMode } from '../types/champion'

export const champions: Champion[] = championsData as Champion[]

export function getChampionById(id: string): Champion | undefined {
  return champions.find(c => c.id === id)
}

export function getChampionByName(name: string): Champion | undefined {
  return champions.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function getRandomChampion(exclude?: string[], mode?: GameMode): Champion {
  let pool = exclude
    ? champions.filter(c => !exclude.includes(c.id))
    : [...champions]

  if (mode === 'quote') {
    pool = pool.filter(c => c.quote && c.quote.length > 5)
  }
  if (mode === 'emoji') {
    pool = pool.filter(c => c.emojiClue && c.emojiClue.length > 0)
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
