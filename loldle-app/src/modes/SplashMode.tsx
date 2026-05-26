import { useMemo, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { getSplashZoom } from '../utils/gameLogic'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/hash'

export function SplashMode({ hardMode }: { hardMode?: boolean }) {
  const { target, guessIds, solved, guessCount, submitGuess, nextRound } = useGame('splash')
  const [skinGuess, setSkinGuess] = useState('')
  const [skinAnswered, setSkinAnswered] = useState(false)

  const randomSkin = useMemo(() => {
    if (!target) return null
    if (target.skins.length === 0) return null
    const idx = Math.abs(hashCode(target.id + 'skin')) % target.skins.length
    return target.skins[idx]
  }, [target])

  const splashUrl = randomSkin?.splash || target?.splash || ''
  const zoom = getSplashZoom(guessCount)

  const wrongGuesses = getWrongGuesses(guessIds, target?.id ?? '')

  if (!target) return null

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {solved ? (
        <>
          <VictoryState champion={target} mode="splash" guessCount={guessCount} onNextRound={nextRound} />
          {randomSkin && (
            <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 text-center">
              {!skinAnswered ? (
                <>
                  <p className="text-lol-text text-sm mb-3">Bonus: Can you name this skin?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skinGuess}
                      onChange={e => setSkinGuess(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && skinGuess) setSkinAnswered(true) }}
                      placeholder="Skin name..."
                      className="flex-1 px-3 py-2 bg-lol-darker border border-lol-border rounded-lg text-sm
                                 text-lol-text-light placeholder-lol-text focus:outline-none focus:border-lol-gold"
                    />
                    <button
                      onClick={() => setSkinAnswered(true)}
                      disabled={!skinGuess}
                      className="px-4 py-2 bg-lol-gold text-lol-dark text-sm font-semibold rounded-lg
                                 hover:bg-lol-text-light transition-colors disabled:opacity-50"
                    >
                      Check
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm">
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
          <div className="w-full aspect-square max-w-sm overflow-hidden rounded-xl border-2 border-lol-border bg-lol-card relative">
            <div
              className="w-full h-full transition-transform duration-700 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={splashUrl}
                alt="Mystery champion splash"
                className="w-full h-full object-cover"
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-lol-text">
              {zoom > 1 ? `${zoom.toFixed(1)}x zoom` : 'Full view'}
            </div>
          </div>

          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Guess the champion..."
            hardMode={hardMode}
          />
        </>
      )}

      {wrongGuesses.length > 0 && !solved && (
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
