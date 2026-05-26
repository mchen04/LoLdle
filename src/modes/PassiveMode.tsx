import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function PassiveMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('passive')

  const passive = useMemo(() => {
    if (!target) return null
    return target.abilities.find(a => a.slot === 'P') || null
  }, [target])

  if (!target || !passive) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const nameRevealed = !!extras.nameRevealed
  const regionRevealed = !!extras.regionRevealed

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <>
          <VictoryState champion={target} mode="passive" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
          <div className="flex items-center gap-3 text-sm text-lol-text">
            <img src={passive.icon} alt="" className="w-8 h-8 rounded" />
            <span>
              <span className="text-lol-gold font-medium">{passive.name}</span> (Passive)
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-lol-card border-2 border-lol-border rounded-xl p-5">
              <img
                src={passive.icon}
                alt="Passive ability"
                className="w-28 h-28 rounded-xl"
                onError={e => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect fill="%231a1f2e" width="112" height="112" rx="12"/><text x="56" y="62" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
                }}
              />
              <p className="text-center text-lol-gold text-xs mt-2 font-medium">PASSIVE</p>
            </div>
            <p className="text-lol-text text-sm">Which champion has this passive?</p>

            <div className="flex flex-col items-center gap-2">
              {nameRevealed && (
                <span className="inline-block bg-lol-gold/15 text-lol-gold px-3 py-1 rounded-full text-sm">
                  {passive.name}
                </span>
              )}
              {regionRevealed && (
                <span className="inline-block bg-lol-gold/15 text-lol-gold px-3 py-1 rounded-full text-sm">
                  Region: {target.regions.join(', ')}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              {!nameRevealed && wrongGuesses.length >= 2 && (
                <button
                  onClick={() => updateExtra('nameRevealed', true)}
                  className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
                >
                  Show passive name
                </button>
              )}
              {!regionRevealed && wrongGuesses.length >= 4 && (
                <button
                  onClick={() => updateExtra('regionRevealed', true)}
                  className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
                >
                  Show region
                </button>
              )}
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
