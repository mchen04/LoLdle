import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

const SLOT_NAMES: Record<string, string> = {
  P: 'Passive', Q: 'Q', W: 'W', E: 'E', R: 'R (Ultimate)',
}

export function SpellNameMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('spellName')

  const primaryAbility = useMemo(() => {
    if (!target || target.abilities.length === 0) return null
    return target.abilities[Math.abs(hashCode(target.id + 'spell')) % target.abilities.length]
  }, [target])

  const secondAbility = useMemo(() => {
    if (!target || target.abilities.length < 2 || !primaryAbility) return null
    const others = target.abilities.filter(a => a.slot !== primaryAbility.slot)
    if (others.length === 0) return null
    return others[Math.abs(hashCode(target.id + 'spell2')) % others.length]
  }, [target, primaryAbility])

  if (!target || !primaryAbility) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const slotRevealed = !!extras.slotRevealed
  const secondRevealed = !!extras.secondRevealed

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <>
          <VictoryState champion={target} mode="spellName" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
          <div className="flex items-center gap-3 text-sm text-lol-text">
            <img src={primaryAbility.icon} alt="" className="w-8 h-8 rounded" />
            <span>
              <span className="text-lol-gold font-medium">{primaryAbility.name}</span>
              {' '}({primaryAbility.slot})
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <p className="text-lol-text text-sm mb-4">Which champion has this ability?</p>
            <p className="text-2xl md:text-3xl text-lol-text-light font-bold tracking-wide">
              {primaryAbility.name}
            </p>

            {slotRevealed && (
              <span className="inline-block mt-3 bg-lol-gold/15 text-lol-gold px-3 py-1 rounded-full text-sm">
                Slot: {SLOT_NAMES[primaryAbility.slot] || primaryAbility.slot}
              </span>
            )}

            {secondRevealed && secondAbility && (
              <div className="mt-3 pt-3 border-t border-lol-border">
                <p className="text-lol-text text-xs mb-1">Same champion also has:</p>
                <p className="text-lg text-lol-text-light font-medium">{secondAbility.name}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!slotRevealed && wrongGuesses.length >= 2 && (
              <button
                onClick={() => updateExtra('slotRevealed', true)}
                className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal ability slot
              </button>
            )}
            {slotRevealed && !secondRevealed && secondAbility && wrongGuesses.length >= 4 && (
              <button
                onClick={() => updateExtra('secondRevealed', true)}
                className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal another ability
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
