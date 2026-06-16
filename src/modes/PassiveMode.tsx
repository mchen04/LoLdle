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
    return target.abilities.find(a => a.slot === 'P') || null
  }, [target])

  if (!passive) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const nameRevealed = !!extras.nameRevealed
  const regionRevealed = !!extras.regionRevealed

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <>
            <VictoryState champion={target} mode="passive" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
            <div className="flex items-center gap-2 text-xs text-lol-text">
              <img src={passive.icon} alt="" className="w-6 h-6 rounded" />
              <span><span className="text-lol-gold font-medium">{passive.name}</span> (Passive)</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-lol-card border-2 border-lol-border rounded-xl p-3 sm:p-4">
              <img src={passive.icon} alt="Passive ability" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl"
                onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%231a1f2e" width="96" height="96" rx="12"/><text x="48" y="54" text-anchor="middle" fill="%23a09b8c" font-size="14">?</text></svg>' }} />
              <p className="text-center text-lol-gold text-[10px] mt-1.5 font-medium">PASSIVE</p>
            </div>
            <p className="text-lol-text text-xs">Which champion has this passive?</p>
            <div className="flex flex-col items-center gap-1">
              {nameRevealed && <span className="inline-block bg-lol-gold/15 text-lol-gold px-2.5 py-0.5 rounded-full text-xs">{passive.name}</span>}
              {regionRevealed && <span className="inline-block bg-lol-gold/15 text-lol-gold px-2.5 py-0.5 rounded-full text-xs">Region: {target.regions.join(', ')}</span>}
            </div>
            <div className="flex gap-3">
              {!nameRevealed && wrongGuesses.length >= 2 && (
                <button onClick={() => updateExtra('nameRevealed', true)} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">Show passive name</button>
              )}
              {!regionRevealed && wrongGuesses.length >= 4 && (
                <button onClick={() => updateExtra('regionRevealed', true)} className="text-xs text-lol-text hover:text-lol-gold transition-colors underline">Show region</button>
              )}
            </div>
          </div>
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
