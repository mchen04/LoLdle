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
  bestScore: number | null
  currentStreak: number
  bestStreak: number
}

const DEFAULT_STATS: ModeStats = {
  gamesPlayed: 0, gamesWon: 0, totalGuesses: 0,
  bestScore: null, currentStreak: 0, bestStreak: 0
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
  const raw = safeJsonParse<Partial<ModeStats> | null>(localStorage.getItem(`${STORAGE_PREFIX}${mode}_stats`), null)
  return {
    gamesPlayed: raw?.gamesPlayed ?? DEFAULT_STATS.gamesPlayed,
    gamesWon: raw?.gamesWon ?? DEFAULT_STATS.gamesWon,
    totalGuesses: raw?.totalGuesses ?? DEFAULT_STATS.totalGuesses,
    bestScore: typeof raw?.bestScore === 'number' && Number.isFinite(raw.bestScore)
      ? raw.bestScore
      : null,
    currentStreak: raw?.currentStreak ?? DEFAULT_STATS.currentStreak,
    bestStreak: raw?.bestStreak ?? DEFAULT_STATS.bestStreak,
  }
}

export function saveModeStats(mode: GameMode, stats: ModeStats) {
  localStorage.setItem(`${STORAGE_PREFIX}${mode}_stats`, JSON.stringify(stats))
}

export function recordResult(mode: GameMode, outcome: 'win' | 'giveUp', guessCount: number) {
  const stats = loadModeStats(mode)
  stats.gamesPlayed++
  if (outcome === 'win') {
    stats.totalGuesses += guessCount
    stats.gamesWon++
    stats.bestScore = stats.bestScore === null ? guessCount : Math.min(stats.bestScore, guessCount)
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
    emoji: 'Emoji', splash: 'Splash', title: 'Title',
    pixel: 'Pixel', spellName: 'Spell',
    feet: 'Feet', whoami: 'Who Am I?', anagram: 'Anagram',
    missingLetters: 'Missing Letters', skinName: 'Skin Name',
    allAbilities: 'All Abilities', zoomedIcon: 'Zoomed Icon',
    warped: 'Warped', colorShift: 'Color Shift',
    backwardsQuote: 'Backwards Quote', passive: 'Passive',
  }
  const squares = solved
    ? Array(guessCount - 1).fill('🟥').concat('🟩').join('')
    : Array(guessCount).fill('🟥').join('')
  return `LoLdle ${modeNames[mode]} - ${solved ? guessCount : 'X'} guesses\n${squares}`
}
