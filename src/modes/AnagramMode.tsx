import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

function shuffleWithSeed(arr: string[], seed: number): string[] {
  const result = [...arr]
  let s = Math.abs(seed)
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff)
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function AnagramMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('anagram')

  const { scrambled, revealed } = useMemo(() => {
    if (!target) return { scrambled: [], revealed: [] }
    const letters = target.name.split('')
    const seed = hashCode(target.id + 'anagram')
    const shuffled = shuffleWithSeed(letters, seed)
    // Make sure it's actually different from the original
    if (shuffled.join('') === target.name) {
      const temp = shuffled[0]
      shuffled[0] = shuffled[shuffled.length - 1]
      shuffled[shuffled.length - 1] = temp
    }
    return { scrambled: shuffled, revealed: letters }
  }, [target])

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  // Each wrong guess locks one letter into its correct position
  const lockedCount = Math.min(wrongGuesses.length, revealed.length - 2)

  const displayLetters = scrambled.map((letter, i) => {
    if (i < lockedCount) {
      return { char: revealed[i], locked: true }
    }
    return { char: letter, locked: false }
  })

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="anagram" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <p className="text-lol-text text-sm mb-4">Unscramble the champion name</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {displayLetters.map((l, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center w-10 h-12 rounded-lg text-xl font-bold uppercase transition-all duration-300 ${
                    l.locked
                      ? 'bg-lol-green/20 text-lol-green border border-lol-green/40'
                      : 'bg-lol-darker border border-lol-border text-lol-text-light'
                  }`}
                >
                  {l.char}
                </span>
              ))}
            </div>
            {lockedCount > 0 && (
              <p className="text-lol-text text-xs mt-3">
                {lockedCount} letter{lockedCount > 1 ? 's' : ''} locked in place
              </p>
            )}
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
