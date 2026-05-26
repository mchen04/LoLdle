import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function TitleMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('title')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const hintLevel = (extras.hintLevel as number) || 0

  const hints: { label: string; value: string }[] = [
    { label: 'First letter', value: target.name[0] || '?' },
    { label: 'Region', value: target.regions.join(', ') },
    { label: 'Species', value: target.species.join(', ') },
  ]

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="title" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 sm:p-5 text-center">
            <p className="text-lol-text text-xs mb-3">Which champion has this title?</p>
            <p className="text-xl sm:text-2xl text-lol-gold italic font-serif tracking-wide">
              {target.title}
            </p>
            {hintLevel > 0 && (
              <div className="mt-3 pt-3 border-t border-lol-border flex flex-wrap justify-center gap-2">
                {hints.slice(0, hintLevel).map(h => (
                  <span key={h.label} className="inline-block bg-lol-gold/15 text-lol-gold px-2 py-0.5 rounded-full text-xs">
                    {h.label}: <span className="font-medium">{h.value}</span>
                  </span>
                ))}
              </div>
            )}
            {hintLevel < hints.length && wrongGuesses.length >= 2 && (
              <button
                onClick={() => updateExtra('hintLevel', hintLevel + 1)}
                className="mt-2 text-xs text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal hint ({hintLevel + 1}/{hints.length})
              </button>
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
