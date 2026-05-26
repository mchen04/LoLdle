export interface Champion {
  id: string
  name: string
  title: string
  gender: string
  positions: string[]
  species: string[]
  resource: string
  rangeType: string
  regions: string[]
  releaseYear: number
  icon: string
  splash: string
  abilities: Ability[]
  skins: Skin[]
  quote: string
  emojiClue: string
}

export interface Ability {
  name: string
  icon: string
  slot: 'P' | 'Q' | 'W' | 'E' | 'R'
}

export interface Skin {
  id: string
  name: string
  splash: string
}

export type MatchResult = 'correct' | 'partial' | 'incorrect'
export type YearHint = 'correct' | 'higher' | 'lower'

export interface ClassicGuessResult {
  champion: Champion
  matches: {
    champion: MatchResult
    gender: MatchResult
    positions: MatchResult
    species: MatchResult
    resource: MatchResult
    rangeType: MatchResult
    regions: MatchResult
    releaseYear: { result: MatchResult; hint: YearHint }
  }
}

export type GameMode = 'classic' | 'quote' | 'ability' | 'emoji' | 'splash'
  | 'title' | 'pixel' | 'spellName' | 'feet' | 'whoami'
  | 'anagram' | 'missingLetters' | 'skinName' | 'allAbilities' | 'zoomedIcon'
  | 'warped' | 'colorShift' | 'backwardsQuote' | 'passive'

export interface GameState {
  mode: GameMode
  targetChampion: Champion | null
  guesses: string[]
  solved: boolean
  guessCount: number
}

export interface AppSettings {
  colorblind: boolean
  scaleToFit: boolean
  clickToGuess: boolean
  hardMode: boolean
}
