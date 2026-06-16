import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function QuoteMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, hintRevealed, submitGuess, nextRound, revealHint, giveUp } = useGame('quote')

  const isFinished = solved || givenUp

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="quote" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <>
            <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 sm:p-5 text-center">
              <div className="text-2xl mb-1 opacity-60">&ldquo;</div>
              <blockquote className="text-base sm:text-lg text-lol-text-light italic leading-relaxed">
                {target.quote || 'No quote available for this champion.'}
              </blockquote>
              <div className="text-2xl mt-1 opacity-60">&rdquo;</div>
              {hintRevealed && guessCount >= 3 && (
                <div className="mt-2 pt-2 border-t border-lol-border">
                  <span className="text-lol-text text-xs">Hint: This champion is from </span>
                  <span className="text-lol-gold text-xs font-medium">{target.regions.join(' / ')}</span>
                </div>
              )}
            </div>
            {!hintRevealed && guessCount >= 3 && (
              <button onClick={revealHint} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">
                Reveal hint
              </button>
            )}
          </>
        )}
        <WrongGuesses guesses={getWrongGuesses(guessIds, target.id)} />
      </div>

      {!isFinished && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-full">
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Who said this?" hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </div>
      )}
    </div>
  )
}
