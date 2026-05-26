import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { getChampionById } from '../data'
import type { Champion } from '../types/champion'

export function QuoteMode({ hardMode }: { hardMode?: boolean }) {
  const { target, guessIds, solved, guessCount, hintRevealed, submitGuess, nextRound, revealHint } = useGame('quote')

  if (!target) return null

  const wrongGuesses = guessIds
    .filter(id => id !== target.id)
    .map(id => getChampionById(id))
    .filter((c): c is Champion => c !== undefined)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {solved ? (
        <VictoryState champion={target} mode="quote" guessCount={guessCount} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <div className="text-4xl mb-4 opacity-60">❝</div>
            <blockquote className="text-xl md:text-2xl text-lol-text-light italic leading-relaxed">
              {target.quote || 'No quote available for this champion.'}
            </blockquote>
            <div className="text-4xl mt-4 opacity-60">❞</div>

            {hintRevealed && guessCount >= 3 && (
              <div className="mt-4 pt-4 border-t border-lol-border">
                <span className="text-lol-text text-sm">Hint: This champion is from </span>
                <span className="text-lol-gold text-sm font-medium">{target.regions.join(' / ')}</span>
              </div>
            )}
          </div>

          {!hintRevealed && guessCount >= 3 && (
            <button
              onClick={revealHint}
              className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
            >
              Reveal hint
            </button>
          )}

          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Who said this?"
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
