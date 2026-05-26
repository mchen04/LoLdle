import { useState, useCallback, useEffect } from 'react'
import type { Champion, GameMode } from '../types/champion'
import { getChampionById, getRandomChampion } from '../data'
import { saveModeProgress, loadModeProgress, clearModeProgress, recordResult } from '../utils/storage'

export function useGame(mode: GameMode) {
  const [target, setTarget] = useState<Champion | null>(null)
  const [guessIds, setGuessIds] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [givenUp, setGivenUp] = useState(false)
  const [hintRevealed, setHintRevealed] = useState(false)
  const [extras, setExtras] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const saved = loadModeProgress(mode)
    const champion = saved ? getChampionById(saved.targetId) : null

    if (saved && champion) {
      setTarget(champion)
      setGuessIds(saved.guessIds)
      setSolved(saved.solved)
      setGivenUp(saved.givenUp ?? false)
      setHintRevealed(saved.hintRevealed ?? false)
      setExtras(saved.extras ?? {})
    } else {
      setTarget(getRandomChampion(undefined, mode))
      setGuessIds([])
      setSolved(false)
      setGivenUp(false)
      setHintRevealed(false)
      setExtras({})
    }
  }, [mode])

  useEffect(() => {
    if (target) {
      saveModeProgress(mode, {
        targetId: target.id,
        guessIds,
        solved,
        givenUp,
        hintRevealed,
        extras,
      })
    }
  }, [mode, target, guessIds, solved, givenUp, hintRevealed, extras])

  const submitGuess = useCallback((champion: Champion) => {
    if (solved || givenUp || !target) return false
    if (guessIds.includes(champion.id)) return false

    const newGuessIds = [champion.id, ...guessIds]
    setGuessIds(newGuessIds)

    if (champion.id === target.id) {
      setSolved(true)
      recordResult(mode, 'win', newGuessIds.length)
      return true
    }
    return false
  }, [solved, givenUp, target, guessIds, mode])

  const giveUp = useCallback(() => {
    if (solved || givenUp || !target) return
    setGivenUp(true)
    recordResult(mode, 'giveUp', guessIds.length)
  }, [solved, givenUp, target, mode, guessIds.length])

  const nextRound = useCallback(() => {
    clearModeProgress(mode)
    const newTarget = getRandomChampion([target?.id || ''], mode)
    setTarget(newTarget)
    setGuessIds([])
    setSolved(false)
    setGivenUp(false)
    setHintRevealed(false)
    setExtras({})
  }, [mode, target])

  const revealHint = useCallback(() => {
    setHintRevealed(true)
  }, [])

  const updateExtra = useCallback((key: string, value: unknown) => {
    setExtras(prev => ({ ...prev, [key]: value }))
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
