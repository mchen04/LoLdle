import type { GameMode, AppSettings } from '../types/champion'

const STORAGE_PREFIX = 'loldle_'

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    console.warn('Failed to parse stored data, using defaults')
    return fallback
  }
}

interface ModeProgress {
  targetId: string
  guessIds: string[]
  solved: boolean
  hintRevealed?: boolean
  givenUp?: boolean
  extras?: Record<string, unknown>
}

interface ModeStats {
  gamesPlayed: number
  gamesWon: number
  totalGuesses: number
  bestScore: number
  currentStreak: number
  bestStreak: number
}

const DEFAULT_STATS: ModeStats = {
  gamesPlayed: 0, gamesWon: 0, totalGuesses: 0,
  bestScore: Infinity, currentStreak: 0, bestStreak: 0
}

const DEFAULT_SETTINGS: AppSettings = {
  colorblind: false,
  scaleToFit: true,
  clickToGuess: true,
  hardMode: false,
}

export function saveModeProgress(mode: GameMode, progress: ModeProgress) {
  localStorage.setItem(`${STORAGE_PREFIX}${mode}_progress`, JSON.stringify(progress))
}

export function loadModeProgress(mode: GameMode): ModeProgress | null {
  return safeJsonParse(localStorage.getItem(`${STORAGE_PREFIX}${mode}_progress`), null)
}

export function clearModeProgress(mode: GameMode) {
  localStorage.removeItem(`${STORAGE_PREFIX}${mode}_progress`)
}

export function loadModeStats(mode: GameMode): ModeStats {
  return safeJsonParse(localStorage.getItem(`${STORAGE_PREFIX}${mode}_stats`), DEFAULT_STATS)
}

export function saveModeStats(mode: GameMode, stats: ModeStats) {
  localStorage.setItem(`${STORAGE_PREFIX}${mode}_stats`, JSON.stringify(stats))
}

export function recordResult(mode: GameMode, outcome: 'win' | 'giveUp', guessCount: number) {
  const stats = loadModeStats(mode)
  stats.gamesPlayed++
  stats.totalGuesses += guessCount
  if (outcome === 'win') {
    stats.gamesWon++
    stats.bestScore = Math.min(stats.bestScore, guessCount)
    stats.currentStreak++
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
  } else {
    stats.currentStreak = 0
  }
  saveModeStats(mode, stats)
}

export function loadSettings(): AppSettings {
  return safeJsonParse(localStorage.getItem(`${STORAGE_PREFIX}settings`), DEFAULT_SETTINGS)
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings))
}

export function generateShareText(mode: GameMode, guessCount: number, solved: boolean): string {
  const modeNames: Record<GameMode, string> = {
    classic: 'Classic', quote: 'Quote', ability: 'Ability',
    emoji: 'Emoji', splash: 'Splash'
  }
  const squares = solved
    ? Array(guessCount - 1).fill('🟥').concat('🟩').join('')
    : Array(guessCount).fill('🟥').join('')
  return `LoLdle ${modeNames[mode]} - ${solved ? guessCount : 'X'} guesses\n${squares}`
}
