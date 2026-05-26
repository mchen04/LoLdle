import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

function getHiddenIndices(name: string, seed: number): number[] {
  const letterIndices = name
    .split('')
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => /[a-zA-Z]/.test(ch))
    .map(({ i }) => i)

  // Hide ~60% of letters initially
  const hideCount = Math.max(2, Math.ceil(letterIndices.length * 0.6))
  const shuffled = [...letterIndices]
  let s = Math.abs(seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff)
    const j = s % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, hideCount)
}

export function MissingLettersMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('missingLetters')

  const hiddenIndices = useMemo(() => {
    if (!target) return []
    return getHiddenIndices(target.name, hashCode(target.id + 'missing'))
  }, [target])

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  // Each wrong guess reveals one hidden letter
  const revealCount = Math.min(wrongGuesses.length, hiddenIndices.length - 1)
  const currentlyHidden = new Set(hiddenIndices.slice(revealCount))

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="missingLetters" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <p className="text-lol-text text-sm mb-4">Fill in the missing letters</p>
            <div className="flex justify-center gap-1 flex-wrap">
              {target.name.split('').map((ch, i) => {
                const isHidden = currentlyHidden.has(i)
                const isSpace = ch === ' '
                const isSpecial = /[^a-zA-Z ]/.test(ch)

                if (isSpace) {
                  return <span key={i} className="w-3" />
                }

                return (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-9 h-11 rounded-lg text-lg font-bold transition-all duration-300 ${
                      isHidden
                        ? 'bg-lol-darker border-2 border-dashed border-lol-border text-transparent'
                        : isSpecial
                          ? 'bg-lol-gold/15 border border-lol-gold/30 text-lol-gold'
                          : 'bg-lol-darker border border-lol-border text-lol-text-light'
                    }`}
                  >
                    {isHidden ? '_' : ch}
                  </span>
                )
              })}
            </div>
            <p className="text-lol-text text-xs mt-3">
              {currentlyHidden.size} letter{currentlyHidden.size > 1 ? 's' : ''} hidden
            </p>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
