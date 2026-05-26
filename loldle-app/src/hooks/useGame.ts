import { useState, useCallback, useEffect } from 'react'
import type { Champion, GameMode } from '../types/champion'
import { getChampionById, getRandomChampion } from '../data'
import { saveModeProgress, loadModeProgress, clearModeProgress, recordWin } from '../utils/storage'

export function useGame(mode: GameMode) {
  const [target, setTarget] = useState<Champion | null>(null)
  const [guessIds, setGuessIds] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [hintRevealed, setHintRevealed] = useState(false)

  useEffect(() => {
    const saved = loadModeProgress(mode)
    if (saved) {
      const champion = getChampionById(saved.targetId)
      if (champion) {
        setTarget(champion)
        setGuessIds(saved.guessIds)
        setSolved(saved.solved)
        setHintRevealed(saved.hintRevealed || false)
        return
      }
    }
    setTarget(getRandomChampion(undefined, mode))
    setGuessIds([])
    setSolved(false)
    setHintRevealed(false)
  }, [mode])

  useEffect(() => {
    if (target) {
      saveModeProgress(mode, {
        targetId: target.id,
        guessIds,
        solved,
        hintRevealed,
      })
    }
  }, [mode, target, guessIds, solved, hintRevealed])

  const submitGuess = useCallback((champion: Champion) => {
    if (solved || !target) return false
    if (guessIds.includes(champion.id)) return false

    const newGuessIds = [champion.id, ...guessIds]
    setGuessIds(newGuessIds)

    if (champion.id === target.id) {
      setSolved(true)
      recordWin(mode, newGuessIds.length)
      return true
    }
    return false
  }, [solved, target, guessIds, mode])

  const nextRound = useCallback(() => {
    clearModeProgress(mode)
    const newTarget = getRandomChampion([target?.id || ''], mode)
    setTarget(newTarget)
    setGuessIds([])
    setSolved(false)
    setHintRevealed(false)
  }, [mode, target])

  const revealHint = useCallback(() => {
    setHintRevealed(true)
  }, [])

  return {
    target,
    guessIds,
    solved,
    guessCount: guessIds.length,
    hintRevealed,
    submitGuess,
    nextRound,
    revealHint,
  }
}
