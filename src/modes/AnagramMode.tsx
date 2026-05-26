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
  const lockedCount = Math.min(wrongGuesses.length, revealed.length - 2)

  const displayLetters = (() => {
    if (lockedCount === 0) return scrambled.map(ch => ({ char: ch, locked: false }))
    const locked = revealed.slice(0, lockedCount)
    const lockedSet = [...locked]
    const remaining = scrambled.filter(ch => {
      const idx = lockedSet.indexOf(ch)
      if (idx !== -1) { lockedSet.splice(idx, 1); return false }
      return true
    })
    let ri = 0
    return revealed.map((ch, i) => {
      if (i < lockedCount) return { char: ch, locked: true }
      return { char: remaining[ri++] || ch, locked: false }
    })
  })()

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="anagram" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 sm:p-5 text-center">
            <p className="text-lol-text text-xs mb-3">Unscramble the champion name</p>
            <div className="flex justify-center gap-1 flex-wrap">
              {displayLetters.map((l, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center w-8 h-10 sm:w-9 sm:h-11 rounded-lg text-lg font-bold uppercase transition-all duration-300 ${
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
              <p className="text-lol-text text-[10px] mt-2">
                {lockedCount} letter{lockedCount > 1 ? 's' : ''} locked in place
              </p>
            )}
          </div>
        )}
        <WrongGuesses guesses={wrongGuesses} />
      </div>

      {!isFinished && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-full">
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </div>
      )}
    </div>
  )
}
