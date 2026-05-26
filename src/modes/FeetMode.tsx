import { useState, useEffect } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

const VISIBLE_PERCENTS = [25, 32, 40, 50, 62, 76, 90, 100]

function getLoadingScreenUrl(id: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`
}

export function FeetMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('feet')
  const [useFallback, setUseFallback] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setUseFallback(false)
    setImgError(false)
  }, [target?.id])

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const visiblePct = isFinished ? 100 : VISIBLE_PERCENTS[Math.min(wrongGuesses.length, VISIBLE_PERCENTS.length - 1)]

  const feetSrc = `/feet/${target.id}.jpg`
  const loadingSrc = getLoadingScreenUrl(target.id)

  const showFullLoading = visiblePct > 25 || isFinished
  const containerHeight = isFinished ? 400 : Math.round((visiblePct / 100) * 400)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="feet" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <p className="text-lol-text text-sm">Guess the champion from their feet</p>
            <div
              className="w-56 overflow-hidden rounded-xl border-2 border-lol-border bg-lol-darker relative transition-all duration-700"
              style={{ height: `${containerHeight}px` }}
            >
              {imgError ? (
                <div className="absolute inset-0 flex items-center justify-center text-lol-text text-sm">?</div>
              ) : !showFullLoading || useFallback ? (
                <img
                  src={feetSrc}
                  alt="Mystery champion feet"
                  className="absolute bottom-0 left-0 w-full h-auto"
                  draggable={false}
                  onError={() => { if (useFallback) setImgError(true); else setUseFallback(true) }}
                />
              ) : (
                <img
                  src={loadingSrc}
                  alt="Mystery champion"
                  className="absolute bottom-0 left-0 w-full transition-all duration-700"
                  style={{
                    height: '400px',
                    objectFit: 'cover',
                    objectPosition: 'center bottom',
                  }}
                  draggable={false}
                  onError={() => setUseFallback(true)}
                />
              )}
              <div className="absolute top-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-lol-text z-10">
                {visiblePct}% visible
              </div>
            </div>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
