import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function QuoteMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, hintRevealed, submitGuess, nextRound, revealHint, giveUp } = useGame('quote')

  if (!target) return null

  const isFinished = solved || givenUp

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="quote" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <div className="text-4xl mb-4 opacity-60">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl text-lol-text-light italic leading-relaxed">
              {target.quote || 'No quote available for this champion.'}
            </blockquote>
            <div className="text-4xl mt-4 opacity-60">&rdquo;</div>
            {hintRevealed && guessCount >= 3 && (
              <div className="mt-4 pt-4 border-t border-lol-border">
                <span className="text-lol-text text-sm">Hint: This champion is from </span>
                <span className="text-lol-gold text-sm font-medium">{target.regions.join(' / ')}</span>
              </div>
            )}
          </div>
          {!hintRevealed && guessCount >= 3 && (
            <button onClick={revealHint} className="text-sm text-lol-text hover:text-lol-gold transition-colors underline">
              Reveal hint
            </button>
          )}
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Who said this?" hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={getWrongGuesses(guessIds, target.id)} />
    </div>
  )
}
