import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/hash'
import type { AppSettings } from '../types/champion'

const ROTATIONS = [90, 180, 270]

export function AbilityMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, hintRevealed, extras, submitGuess, nextRound, revealHint, giveUp, updateExtra } = useGame('ability')

  const randomAbility = useMemo(() => {
    if (!target || target.abilities.length === 0) return null
    return target.abilities[Math.abs(hashCode(target.id)) % target.abilities.length]
  }, [target])

  const rotation = useMemo(() => {
    if (!target) return 90
    return ROTATIONS[Math.abs(hashCode(target.id + 'rot')) % ROTATIONS.length]
  }, [target])

  if (!target || !randomAbility) return null

  const isFinished = solved || givenUp
  const colorRestored = (extras.colorRestored as boolean) ?? false
  const rotationFixed = (extras.rotationFixed as boolean) ?? false

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <>
          <VictoryState champion={target} mode="ability" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
          <p className="text-sm text-lol-text">
            <span className="text-lol-gold font-medium">{randomAbility.name}</span>
            {' '}({randomAbility.slot})
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <img
              src={randomAbility.icon}
              alt="Mystery ability"
              className="w-28 h-28 rounded-xl border-2 border-lol-border shadow-lg transition-all duration-500"
              style={{
                filter: colorRestored ? 'none' : 'grayscale(1)',
                transform: rotationFixed ? 'rotate(0deg)' : `rotate(${rotation}deg)`,
              }}
              onError={e => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect fill="%231a1f2e" width="112" height="112" rx="12"/><text x="56" y="62" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
              }}
            />
            <p className="text-lol-text text-sm">Which champion has this ability?</p>
            <div className="flex gap-2">
              <button
                onClick={() => updateExtra('colorRestored', true)}
                disabled={colorRestored}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  colorRestored
                    ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default'
                    : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                }`}
              >
                {colorRestored ? 'Color restored' : 'Restore color'}
              </button>
              <button
                onClick={() => updateExtra('rotationFixed', true)}
                disabled={rotationFixed}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  rotationFixed
                    ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default'
                    : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                }`}
              >
                {rotationFixed ? 'Rotation fixed' : 'Fix rotation'}
              </button>
            </div>
            {hintRevealed ? (
              <span className="inline-block bg-lol-gold/20 text-lol-gold px-3 py-1 rounded-full text-sm font-medium">
                Slot: {randomAbility.slot === 'P' ? 'Passive' : randomAbility.slot}
              </span>
            ) : (
              <button onClick={revealHint} className="text-sm text-lol-text hover:text-lol-gold transition-colors underline">
                Reveal ability slot
              </button>
            )}
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={getWrongGuesses(guessIds, target.id)} />
    </div>
  )
}
