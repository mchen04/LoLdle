import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

const HUE_STAGES = [180, 150, 120, 90, 60, 35, 15, 0]

export function ColorShiftMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('colorShift')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const hue = isFinished ? 0 : HUE_STAGES[Math.min(wrongGuesses.length, HUE_STAGES.length - 1)]

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="colorShift" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={target.icon}
                alt="Mystery champion"
                className="w-36 h-36 rounded-xl border-2 border-lol-border shadow-lg transition-all duration-700"
                style={{ filter: `hue-rotate(${hue}deg) saturate(${hue > 0 ? 1.3 : 1})` }}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect fill="%231a1f2e" width="144" height="144" rx="12"/><text x="72" y="78" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
                }}
              />
              <div className="absolute bottom-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-lol-text">
                {hue > 0 ? `+${hue}°` : 'True colors'}
              </div>
            </div>
            <p className="text-lol-text text-sm">Who is this color-shifted champion?</p>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
