import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { getWrongGuesses } from '../data'

function parseEmojis(str: string): string[] {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
  return [...segmenter.segment(str)]
    .map(s => s.segment)
    .filter(s => s.trim().length > 0)
    .slice(0, 5)
}

export function EmojiMode({ hardMode }: { hardMode?: boolean }) {
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

          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Guess the champion..."
            hardMode={hardMode}
          />

          <button
            onClick={giveUp}
            className="text-xs text-lol-text/60 hover:text-lol-red transition-colors"
          >
            Give Up
          </button>
        </>
      )}

      {wrongGuesses.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs text-lol-text uppercase tracking-wider">Wrong guesses</p>
          <div className="flex flex-wrap gap-2">
            {wrongGuesses.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-lol-red/30 px-3 py-1.5 rounded-lg">
                <img src={c.icon} alt="" className="w-6 h-6 rounded" />
                <span className="text-sm text-lol-text-light">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
