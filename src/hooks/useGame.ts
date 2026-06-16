import { useState, useCallback, useEffect } from 'react'
import type { Champion, GameMode } from '../types/champion'
import { getChampionById, getRandomChampion } from '../data'
import { saveModeProgress, loadModeProgress, clearModeProgress, recordResult } from '../utils/storage'

interface GameRuntimeState {
  target: Champion
  guessIds: string[]
  solved: boolean
  givenUp: boolean
  hintRevealed: boolean
  extras: Record<string, unknown>
}

function createGameState(mode: GameMode): GameRuntimeState {
  const saved = loadModeProgress(mode)
  const champion = saved ? getChampionById(saved.targetId) : null

  if (saved && champion) {
    return {
      target: champion,
      guessIds: saved.guessIds,
      solved: saved.solved,
      givenUp: saved.givenUp ?? false,
      hintRevealed: saved.hintRevealed ?? false,
      extras: saved.extras ?? {},
    }
  }

  return {
    target: getRandomChampion(undefined, mode),
    guessIds: [],
    solved: false,
    givenUp: false,
    hintRevealed: false,
    extras: {},
  }
}

export function useGame(mode: GameMode) {
  const [state, setState] = useState(() => createGameState(mode))
  const { target, guessIds, solved, givenUp, hintRevealed, extras } = state

  useEffect(() => {
    saveModeProgress(mode, {
      targetId: target.id,
      guessIds,
      solved,
      givenUp,
      hintRevealed,
      extras,
    })
  }, [mode, target, guessIds, solved, givenUp, hintRevealed, extras])

  const submitGuess = useCallback((champion: Champion) => {
    if (solved || givenUp) return false
    if (guessIds.includes(champion.id)) return false

    const newGuessIds = [champion.id, ...guessIds]

    if (champion.id === target.id) {
      recordResult(mode, 'win', newGuessIds.length)
      setState(prev => ({ ...prev, guessIds: newGuessIds, solved: true }))
      return true
    }
    setState(prev => ({ ...prev, guessIds: newGuessIds }))
    return false
  }, [solved, givenUp, target, guessIds, mode])

  const giveUp = useCallback(() => {
    if (solved || givenUp) return
    setState(prev => ({ ...prev, givenUp: true }))
    recordResult(mode, 'giveUp', guessIds.length)
  }, [solved, givenUp, mode, guessIds.length])

  const nextRound = useCallback(() => {
    clearModeProgress(mode)
    setState({
      target: getRandomChampion([target.id], mode),
      guessIds: [],
      solved: false,
      givenUp: false,
      hintRevealed: false,
      extras: {},
    })
  }, [mode, target])

  const revealHint = useCallback(() => {
    setState(prev => ({ ...prev, hintRevealed: true }))
  }, [])

  const updateExtra = useCallback((key: string, value: unknown) => {
    setState(prev => ({ ...prev, extras: { ...prev.extras, [key]: value } }))
  }, [])

  return {
    target,
    guessIds,
    solved,
    givenUp,
    guessCount: guessIds.length,
    hintRevealed,
    extras,
    submitGuess,
    nextRound,
    revealHint,
    giveUp,
    updateExtra,
  }
}
