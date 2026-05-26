import type { Champion, ClassicGuessResult, MatchResult, YearHint } from '../types/champion'

export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return hash
}

function arrayMatch(a: string[], b: string[]): MatchResult {
  if (a.length === 0 || b.length === 0) return 'incorrect'
  const setA = new Set(a.map(s => s.toLowerCase()))
  const setB = new Set(b.map(s => s.toLowerCase()))
  if (setA.size === setB.size && [...setA].every(x => setB.has(x))) return 'correct'
  if ([...setA].some(x => setB.has(x)) || [...setB].some(x => setA.has(x))) return 'partial'
  return 'incorrect'
}

function stringMatch(a: string, b: string): MatchResult {
  return a.toLowerCase() === b.toLowerCase() ? 'correct' : 'incorrect'
}

function yearMatch(guessYear: number, targetYear: number): { result: MatchResult; hint: YearHint } {
  if (guessYear === targetYear) return { result: 'correct', hint: 'correct' }
  return {
    result: 'incorrect',
    hint: targetYear > guessYear ? 'higher' : 'lower'
  }
}

export function evaluateClassicGuess(guess: Champion, target: Champion): ClassicGuessResult {
  return {
    champion: guess,
    matches: {
      champion: guess.id === target.id ? 'correct' : 'incorrect',
      gender: stringMatch(guess.gender, target.gender),
      positions: arrayMatch(guess.positions, target.positions),
      species: arrayMatch(guess.species, target.species),
      resource: stringMatch(guess.resource, target.resource),
      rangeType: stringMatch(guess.rangeType, target.rangeType),
      regions: arrayMatch(guess.regions, target.regions),
      releaseYear: yearMatch(guess.releaseYear, target.releaseYear),
    }
  }
}

export function getMatchColor(result: MatchResult, colorblind: boolean): string {
  if (result === 'correct') return colorblind ? 'bg-blue-600' : 'bg-lol-green'
  if (result === 'partial') return colorblind ? 'bg-yellow-500' : 'bg-lol-orange'
  return 'bg-lol-wrong'
}

const ZOOM_LEVELS = [5, 4, 3, 2.5, 2, 1.5, 1.2, 1]

export function getSplashZoom(guessCount: number): number {
  return ZOOM_LEVELS[Math.min(guessCount, ZOOM_LEVELS.length - 1)]
}
