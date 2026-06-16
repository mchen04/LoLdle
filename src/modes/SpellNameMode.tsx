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
    if (target.abilities.length === 0) return null
    return target.abilities[Math.abs(hashCode(target.id + 'spell')) % target.abilities.length]
  }, [target])

  const secondAbility = useMemo(() => {
    if (target.abilities.length < 2 || !primaryAbility) return null
    const others = target.abilities.filter(a => a.slot !== primaryAbility.slot)
    if (others.length === 0) return null
    return others[Math.abs(hashCode(target.id + 'spell2')) % others.length]
  }, [target, primaryAbility])

  if (!primaryAbility) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const slotRevealed = !!extras.slotRevealed
  const secondRevealed = !!extras.secondRevealed

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <>
            <VictoryState champion={target} mode="spellName" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
            <div className="flex items-center gap-2 text-xs text-lol-text">
              <img src={primaryAbility.icon} alt="" className="w-6 h-6 rounded" />
              <span>
                <span className="text-lol-gold font-medium">{primaryAbility.name}</span>
                {' '}({primaryAbility.slot})
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 sm:p-5 text-center">
              <p className="text-lol-text text-xs mb-3">Which champion has this ability?</p>
              <p className="text-xl sm:text-2xl text-lol-text-light font-bold tracking-wide">
                {primaryAbility.name}
              </p>
              {slotRevealed && (
                <span className="inline-block mt-2 bg-lol-gold/15 text-lol-gold px-2.5 py-0.5 rounded-full text-xs">
                  Slot: {SLOT_NAMES[primaryAbility.slot] || primaryAbility.slot}
                </span>
              )}
              {secondRevealed && secondAbility && (
                <div className="mt-2 pt-2 border-t border-lol-border">
                  <p className="text-lol-text text-[10px] mb-0.5">Same champion also has:</p>
                  <p className="text-base text-lol-text-light font-medium">{secondAbility.name}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {!slotRevealed && wrongGuesses.length >= 2 && (
                <button onClick={() => updateExtra('slotRevealed', true)} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">
                  Reveal ability slot
                </button>
              )}
              {slotRevealed && !secondRevealed && secondAbility && wrongGuesses.length >= 4 && (
                <button onClick={() => updateExtra('secondRevealed', true)} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">
                  Reveal another ability
                </button>
              )}
            </div>
          </>
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
