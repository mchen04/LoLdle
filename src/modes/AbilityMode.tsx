import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

const ROTATIONS = [90, 180, 270]

export function AbilityMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, hintRevealed, extras, submitGuess, nextRound, revealHint, giveUp, updateExtra } = useGame('ability')

  const randomAbility = useMemo(() => {
    if (target.abilities.length === 0) return null
    return target.abilities[Math.abs(hashCode(target.id)) % target.abilities.length]
  }, [target])

  const rotation = useMemo(() => {
    return ROTATIONS[Math.abs(hashCode(target.id + 'rot')) % ROTATIONS.length]
  }, [target])

  if (!randomAbility) return null

  const isFinished = solved || givenUp
  const colorRestored = !!extras.colorRestored
  const rotationFixed = !!extras.rotationFixed

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <>
            <VictoryState champion={target} mode="ability" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
            <p className="text-xs text-lol-text">
              <span className="text-lol-gold font-medium">{randomAbility.name}</span>
              {' '}({randomAbility.slot})
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src={randomAbility.icon}
              alt="Mystery ability"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-lol-border shadow-lg transition-all duration-500"
              style={{
                filter: colorRestored ? 'none' : 'grayscale(1)',
                transform: rotationFixed ? 'rotate(0deg)' : `rotate(${rotation}deg)`,
              }}
              onError={e => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%231a1f2e" width="96" height="96" rx="12"/><text x="48" y="54" text-anchor="middle" fill="%23a09b8c" font-size="14">?</text></svg>'
              }}
            />
            <p className="text-lol-text text-xs">Which champion has this ability?</p>
            <div className="flex gap-2">
              <button
                onClick={() => updateExtra('colorRestored', true)}
                disabled={colorRestored}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  colorRestored
                    ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default'
                    : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                }`}
              >
                {colorRestored ? 'Color ✓' : 'Restore color'}
              </button>
              <button
                onClick={() => updateExtra('rotationFixed', true)}
                disabled={rotationFixed}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  rotationFixed
                    ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default'
                    : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                }`}
              >
                {rotationFixed ? 'Rotation ✓' : 'Fix rotation'}
              </button>
            </div>
            {hintRevealed ? (
              <span className="inline-block bg-lol-gold/20 text-lol-gold px-2.5 py-0.5 rounded-full text-xs font-medium">
                Slot: {randomAbility.slot === 'P' ? 'Passive' : randomAbility.slot}
              </span>
            ) : (
              <button onClick={revealHint} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">
                Reveal ability slot
              </button>
            )}
          </div>
        )}
        <WrongGuesses guesses={getWrongGuesses(guessIds, target.id)} />
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
