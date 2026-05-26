import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

function parseEmojis(str: string): string[] {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
  return [...segmenter.segment(str)]
    .map(s => s.segment)
    .filter(s => s.trim().length > 0)
    .slice(0, 5)
}

export function EmojiMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('emoji')

  const emojiArray = useMemo(() => {
    if (!target?.emojiClue) return []
    return parseEmojis(target.emojiClue)
  }, [target])

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const revealedCount = isFinished ? emojiArray.length : Math.min(wrongGuesses.length + 1, emojiArray.length)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="emoji" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="bg-lol-card border border-lol-border rounded-xl p-8 text-center">
            <p className="text-lol-text text-sm mb-4">Which champion do these emoji represent?</p>
            <div className="text-6xl md:text-7xl tracking-widest select-none flex justify-center gap-2">
              {emojiArray.map((emoji, i) => (
                <span
                  key={i}
                  className={`transition-all duration-500 ${
                    i < revealedCount ? 'opacity-100 scale-100' : 'opacity-20 scale-75 blur-sm'
                  }`}
                >
                  {i < revealedCount ? emoji : '?'}
                </span>
              ))}
            </div>
            <p className="text-lol-text text-xs mt-3">
              {revealedCount} / {emojiArray.length} clues revealed
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
