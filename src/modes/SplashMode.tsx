import { useMemo, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getSplashZoom, hashCode } from '../utils/gameLogic'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function SplashMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('splash')
  const [skinGuess, setSkinGuess] = useState('')
  const [skinAnswered, setSkinAnswered] = useState(false)

  const randomSkin = useMemo(() => {
    if (!target || target.skins.length === 0) return null
    return target.skins[Math.abs(hashCode(target.id + 'skin')) % target.skins.length]
  }, [target])

  const cropOrigin = useMemo(() => {
    if (!target) return '50% 50%'
    const x = (Math.abs(hashCode(target.id + 'cropX')) % 60) + 20
    const y = (Math.abs(hashCode(target.id + 'cropY')) % 60) + 20
    return `${x}% ${y}%`
  }, [target])

  if (!target) return null

  const splashUrl = randomSkin?.splash || target.splash
  const zoom = getSplashZoom(guessCount)
  const isFinished = solved || givenUp

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <>
            <VictoryState champion={target} mode="splash" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
            {randomSkin && (
              <div className="w-full bg-lol-card border border-lol-border rounded-xl p-3 text-center">
                {!skinAnswered ? (
                  <>
                    <p className="text-lol-text text-xs mb-2">Bonus: Can you name this skin?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skinGuess}
                        onChange={e => setSkinGuess(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && skinGuess) setSkinAnswered(true) }}
                        placeholder="Skin name..."
                        className="flex-1 px-3 py-1.5 bg-lol-darker border border-lol-border rounded-lg text-xs
                                   text-lol-text-light placeholder-lol-text focus:outline-none focus:border-lol-gold"
                      />
                      <button
                        onClick={() => setSkinAnswered(true)}
                        disabled={!skinGuess}
                        className="px-3 py-1.5 bg-lol-gold text-lol-dark text-xs font-semibold rounded-lg
                                   hover:bg-lol-text-light transition-colors disabled:opacity-50"
                      >
                        Check
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs">
                    {randomSkin.name.toLowerCase().includes(skinGuess.toLowerCase().trim())
                      ? <span className="text-lol-green">Correct! It's {randomSkin.name}</span>
                      : <span className="text-lol-orange">It was: {randomSkin.name}</span>
                    }
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-full aspect-[4/3] max-w-xs sm:max-w-sm overflow-hidden rounded-xl border-2 border-lol-border bg-lol-card relative">
              <div
                className="w-full h-full transition-transform duration-700 ease-out"
                style={{ transform: `scale(${zoom})`, transformOrigin: cropOrigin }}
              >
                <img
                  src={splashUrl}
                  alt="Mystery champion splash"
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(1)' }}
                  draggable={false}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-lol-text">
                {zoom > 1 ? `${zoom.toFixed(1)}x zoom` : 'Full view'}
              </div>
            </div>
            <WrongGuesses guesses={getWrongGuesses(guessIds, target.id)} />
          </>
        )}
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
