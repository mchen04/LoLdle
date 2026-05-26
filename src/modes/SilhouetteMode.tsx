import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

const REVEAL_STAGES: { filter: string; label: string }[] = [
  { filter: 'brightness(0) contrast(100%)', label: 'Solid shadow' },
  { filter: 'brightness(0) contrast(100%)', label: 'Solid shadow' },
  { filter: 'brightness(0.15) contrast(200%) grayscale(1)', label: 'Faint outline' },
  { filter: 'brightness(0.15) contrast(200%) grayscale(1)', label: 'Faint outline' },
  { filter: 'brightness(0.4) contrast(150%) grayscale(1)', label: 'Dark grayscale' },
  { filter: 'brightness(0.7) grayscale(1)', label: 'Grayscale' },
  { filter: 'brightness(0.9) grayscale(0.5)', label: 'Faded color' },
  { filter: 'none', label: 'Full reveal' },
]

export function SilhouetteMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('silhouette')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const stage = isFinished
    ? REVEAL_STAGES.length - 1
    : Math.min(wrongGuesses.length, REVEAL_STAGES.length - 1)
  const { filter, label } = REVEAL_STAGES[stage]

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="silhouette" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="relative bg-lol-card border-2 border-lol-border rounded-xl p-4">
              <img
                src={target.splash}
                alt="Mystery champion"
                className="w-72 h-44 object-cover rounded-lg transition-all duration-700"
                style={{ filter }}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="176"><rect fill="%231a1f2e" width="288" height="176" rx="12"/><text x="144" y="94" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-lol-text">
                {label}
              </div>
            </div>
            <p className="text-lol-text text-sm">Guess the champion from their silhouette</p>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
