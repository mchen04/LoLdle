import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { getChampionById } from '../data'
import type { Champion } from '../types/champion'

export function EmojiMode({ hardMode }: { hardMode?: boolean }) {
  const { target, guessIds, solved, guessCount, submitGuess, nextRound } = useGame('emoji')

  if (!target) return null

  const wrongGuesses = guessIds
    .filter(id => id !== target.id)
    .map(id => getChampionById(id))
    .filter((c): c is Champion => c !== undefined)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {solved ? (
        <VictoryState champion={target} mode="emoji" guessCount={guessCount} onNextRound={nextRound} />
      ) : (
        <>
          <div className="bg-lol-card border border-lol-border rounded-xl p-8 text-center">
            <p className="text-lol-text text-sm mb-4">Which champion do these emoji represent?</p>
            <div className="text-6xl md:text-7xl tracking-widest select-none">
              {target.emojiClue || '❓❓❓'}
            </div>
          </div>

          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Guess the champion..."
            hardMode={hardMode}
          />
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
