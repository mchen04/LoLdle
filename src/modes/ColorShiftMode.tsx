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

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const hue = isFinished ? 0 : HUE_STAGES[Math.min(wrongGuesses.length, HUE_STAGES.length - 1)]

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="colorShift" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img src={target.icon} alt="Mystery champion"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-lol-border shadow-lg transition-all duration-700"
                style={{ filter: `hue-rotate(${hue}deg) saturate(${hue > 0 ? 1.3 : 1})` }} draggable={false}
                onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="%231a1f2e" width="128" height="128" rx="12"/><text x="64" y="70" text-anchor="middle" fill="%23a09b8c" font-size="14">?</text></svg>' }} />
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-lol-text">{hue > 0 ? `+${hue}°` : 'True colors'}</div>
            </div>
            <p className="text-lol-text text-xs">Who is this color-shifted champion?</p>
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
