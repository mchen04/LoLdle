import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { getChampionById } from '../data'
import { hashCode } from '../utils/hash'
import type { Champion } from '../types/champion'

export function AbilityMode({ hardMode }: { hardMode?: boolean }) {
  const { target, guessIds, solved, guessCount, hintRevealed, submitGuess, nextRound, revealHint } = useGame('ability')

  const randomAbility = useMemo(() => {
    if (!target || target.abilities.length === 0) return null
    const idx = Math.abs(hashCode(target.id)) % target.abilities.length
    return target.abilities[idx]
  }, [target])

  if (!target || !randomAbility) return null

  const wrongGuesses = guessIds
    .filter(id => id !== target.id)
    .map(id => getChampionById(id))
    .filter((c): c is Champion => c !== undefined)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {solved ? (
        <>
          <VictoryState champion={target} mode="ability" guessCount={guessCount} onNextRound={nextRound} />
          <div className="text-center text-lol-text">
            <p className="text-sm">
              <span className="text-lol-gold font-medium">{randomAbility.name}</span>
              {' '}({randomAbility.slot})
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <img
              src={randomAbility.icon}
              alt="Mystery ability"
              className="w-28 h-28 rounded-xl border-2 border-lol-border shadow-lg"
              onError={e => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect fill="%231a1f2e" width="112" height="112" rx="12"/><text x="56" y="62" text-anchor="middle" fill="%23a09b8c" font-size="16">?</text></svg>'
              }}
            />

            <p className="text-lol-text text-sm">Which champion has this ability?</p>

            {hintRevealed ? (
              <span className="inline-block bg-lol-gold/20 text-lol-gold px-3 py-1 rounded-full text-sm font-medium">
                Slot: {randomAbility.slot === 'P' ? 'Passive' : randomAbility.slot}
              </span>
            ) : (
              <button
                onClick={revealHint}
                className="text-sm text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal ability slot
              </button>
            )}
          </div>

          <ChampionSearch
            onSelect={submitGuess}
            usedIds={guessIds}
            placeholder="Guess the champion..."
            hardMode={hardMode}
          />
        </>
      )}

      {wrongGuesses.length > 0 && (
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
