import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

function stripChampionName(skinName: string, championName: string): string {
  return skinName.replace(new RegExp(`\\s*${championName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi'), '').trim()
}

export function SkinNameMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('skinName')

  const randomSkin = useMemo(() => {
    if (!target || target.skins.length === 0) return null
    return target.skins[Math.abs(hashCode(target.id + 'skinname')) % target.skins.length]
  }, [target])

  if (!target || !randomSkin) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const skinLine = stripChampionName(randomSkin.name, target.name)
  const nameWasStripped = skinLine !== randomSkin.name
  const splashRevealed = !!extras.splashRevealed

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <>
          <VictoryState champion={target} mode="skinName" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
          <div className="text-sm text-lol-text text-center">
            Skin: <span className="text-lol-gold font-medium">{randomSkin.name}</span>
          </div>
        </>
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <p className="text-lol-text text-sm mb-4">Which champion has this skin?</p>
            <p className="text-2xl md:text-3xl text-lol-gold font-bold tracking-wide">
              {skinLine || randomSkin.name}
            </p>
            <p className="text-lol-text text-xs mt-2 italic">
              {nameWasStripped ? '(champion name removed)' : ''}
            </p>

            {splashRevealed && (
              <div className="mt-4">
                <img
                  src={randomSkin.splash}
                  alt="Skin splash hint"
                  className="w-full h-32 object-cover rounded-lg border border-lol-border"
                  style={{ filter: 'blur(8px) grayscale(0.8)' }}
                  onError={e => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="128"><rect fill="%231a1f2e" width="400" height="128" rx="8"/><text x="200" y="70" text-anchor="middle" fill="%23a09b8c" font-size="14">Image unavailable</text></svg>'
                  }}
                />
              </div>
            )}

            {!splashRevealed && wrongGuesses.length >= 3 && (
              <button
                onClick={() => updateExtra('splashRevealed', true)}
                className="mt-3 text-sm text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal blurred splash
              </button>
            )}
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
