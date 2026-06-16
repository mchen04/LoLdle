import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

const ZOOM_LEVELS = [7, 5.5, 4, 3, 2.5, 2, 1.5, 1]

export function ZoomedIconMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('zoomedIcon')

  const cropOrigin = useMemo(() => {
    const x = (Math.abs(hashCode(target.id + 'zoomX')) % 50) + 25
    const y = (Math.abs(hashCode(target.id + 'zoomY')) % 50) + 25
    return `${x}% ${y}%`
  }, [target])

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const zoom = isFinished ? 1 : ZOOM_LEVELS[Math.min(wrongGuesses.length, ZOOM_LEVELS.length - 1)]

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="zoomedIcon" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden rounded-xl border-2 border-lol-border bg-lol-card relative">
              <div className="w-full h-full transition-transform duration-700 ease-out" style={{ transform: `scale(${zoom})`, transformOrigin: cropOrigin }}>
                <img src={target.icon} alt="Mystery champion" className="w-full h-full object-cover" draggable={false}
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="%231a1f2e" width="128" height="128" rx="12"/><text x="64" y="70" text-anchor="middle" fill="%23a09b8c" font-size="14">?</text></svg>' }} />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-lol-text">{zoom > 1 ? `${zoom.toFixed(1)}x` : 'Full'}</div>
            </div>
            <p className="text-lol-text text-xs">Identify the champion icon</p>
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
