import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

interface WarpStage {
  transform: string
  filter: string
  label: string
}

const WARP_STAGES: WarpStage[] = [
  { transform: 'perspective(200px) rotateY(35deg) skewX(15deg) scaleX(0.7)', filter: 'contrast(1.8) saturate(2.5) hue-rotate(90deg)', label: 'Heavily warped' },
  { transform: 'perspective(200px) rotateY(35deg) skewX(15deg) scaleX(0.7)', filter: 'contrast(1.5) saturate(2) hue-rotate(90deg)', label: 'Heavily warped' },
  { transform: 'perspective(300px) rotateY(25deg) skewX(8deg) scaleX(0.8)', filter: 'contrast(1.4) saturate(1.5) hue-rotate(60deg)', label: 'Warped' },
  { transform: 'perspective(300px) rotateY(25deg) skewX(8deg) scaleX(0.8)', filter: 'contrast(1.3) saturate(1.3) hue-rotate(40deg)', label: 'Warped' },
  { transform: 'perspective(400px) rotateY(15deg) skewX(3deg) scaleX(0.9)', filter: 'contrast(1.2) hue-rotate(20deg)', label: 'Slightly warped' },
  { transform: 'perspective(500px) rotateY(8deg) scaleX(0.95)', filter: 'contrast(1.1) hue-rotate(10deg)', label: 'Nearly clear' },
  { transform: 'none', filter: 'none', label: 'Clear' },
]

export function WarpedMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('warped')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const stageIdx = isFinished
    ? WARP_STAGES.length - 1
    : Math.min(wrongGuesses.length, WARP_STAGES.length - 1)
  const stage = WARP_STAGES[stageIdx]

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="warped" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="w-72 overflow-hidden rounded-xl border-2 border-lol-border bg-lol-card relative p-2">
              <img
                src={target.splash}
                alt="Mystery champion"
                className="w-full h-44 object-cover rounded-lg transition-all duration-700"
                style={{ transform: stage.transform, filter: stage.filter }}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="176"><rect fill="%231a1f2e" width="288" height="176" rx="12"/><text x="144" y="94" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
                }}
              />
              <div className="absolute bottom-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-lol-text">
                {stage.label}
              </div>
            </div>
            <p className="text-lol-text text-sm">Identify this warped champion</p>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
