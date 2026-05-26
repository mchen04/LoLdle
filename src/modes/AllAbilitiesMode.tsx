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
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <>
          <VictoryState champion={target} mode="allAbilities" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
          <div className="flex gap-2">
            {sortedAbilities.map(a => (
              <div key={a.slot} className="flex flex-col items-center gap-1">
                <img src={a.icon} alt={a.name} className="w-10 h-10 rounded border border-lol-border" />
                <span className="text-[10px] text-lol-text">{a.slot}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6">
            <p className="text-lol-text text-sm mb-4 text-center">Identify the champion from their full ability kit</p>
            <div className="flex justify-center gap-3">
              {sortedAbilities.map(a => (
                <div key={a.slot} className="flex flex-col items-center gap-1">
                  <img
                    src={a.icon}
                    alt="Ability"
                    className="w-14 h-14 rounded-lg border border-lol-border transition-all duration-500"
                    style={{ filter: colorRestored ? 'none' : 'grayscale(1) brightness(0.8)' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect fill="%231a1f2e" width="56" height="56" rx="8"/><text x="28" y="34" text-anchor="middle" fill="%23a09b8c" font-size="12">?</text></svg>'
                    }}
                  />
                  <span className="text-[10px] text-lol-text font-medium">{a.slot}</span>
                  {namesRevealed && (
                    <span className="text-[9px] text-lol-gold max-w-14 text-center leading-tight truncate">{a.name}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-4">
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
              {wrongGuesses.length >= 3 && (
                <button
                  onClick={() => updateExtra('namesRevealed', true)}
                  disabled={namesRevealed}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    namesRevealed
                      ? 'border-lol-green/30 text-lol-green bg-lol-green/10 cursor-default'
                      : 'border-lol-border text-lol-text hover:text-lol-gold hover:border-lol-gold'
                  }`}
                >
                  {namesRevealed ? 'Names shown' : 'Show names'}
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
