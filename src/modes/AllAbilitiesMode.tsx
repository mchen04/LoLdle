import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

const SLOT_ORDER = ['P', 'Q', 'W', 'E', 'R']

export function AllAbilitiesMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('allAbilities')

  if (!target || target.abilities.length === 0) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const colorRestored = !!extras.colorRestored
  const namesRevealed = !!extras.namesRevealed

  const sortedAbilities = [...target.abilities].sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
  )

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <>
            <VictoryState champion={target} mode="allAbilities" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
            <div className="flex gap-2">
              {sortedAbilities.map(a => (
                <div key={a.slot} className="flex flex-col items-center gap-0.5">
                  <img src={a.icon} alt={a.name} className="w-8 h-8 rounded border border-lol-border" />
                  <span className="text-[9px] text-lol-text">{a.slot}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4">
            <p className="text-lol-text text-xs mb-3 text-center">Identify the champion from their full ability kit</p>
            <div className="flex justify-center gap-2 sm:gap-3">
              {sortedAbilities.map(a => (
                <div key={a.slot} className="flex flex-col items-center gap-0.5">
                  <img
                    src={a.icon}
                    alt="Ability"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-lol-border transition-all duration-500"
                    style={{ filter: colorRestored ? 'none' : 'grayscale(1) brightness(0.8)' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%231a1f2e" width="48" height="48" rx="8"/><text x="24" y="30" text-anchor="middle" fill="%23a09b8c" font-size="10">?</text></svg>'
                    }}
                  />
                  <span className="text-[9px] text-lol-text font-medium">{a.slot}</span>
                  {namesRevealed && (
                    <span className="text-[8px] text-lol-gold max-w-12 text-center leading-tight truncate">{a.name}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => updateExtra('colorRestored', true)}
                disabled={colorRestored}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  colorRestored ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default' : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                }`}
              >
                {colorRestored ? 'Color ✓' : 'Restore color'}
              </button>
              {wrongGuesses.length >= 3 && (
                <button
                  onClick={() => updateExtra('namesRevealed', true)}
                  disabled={namesRevealed}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    namesRevealed ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default' : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                  }`}
                >
                  {namesRevealed ? 'Names ✓' : 'Show names'}
                </button>
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
