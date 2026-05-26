import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { Champion, AppSettings } from '../types/champion'

interface Clue {
  label: string
  value: string
  icon: string
}

function buildClues(champion: Champion): Clue[] {
  return [
    { label: 'Range', value: champion.rangeType, icon: champion.rangeType === 'Melee' ? '⚔️' : '🏹' },
    { label: 'Resource', value: champion.resource, icon: '💎' },
    { label: 'Gender', value: champion.gender, icon: '👤' },
    { label: 'Position', value: champion.positions.join(', '), icon: '📍' },
    { label: 'Species', value: champion.species.join(', '), icon: '🧬' },
    { label: 'Region', value: champion.regions.join(', '), icon: '🗺️' },
    { label: 'Released', value: String(champion.releaseYear), icon: '📅' },
  ]
}

export function WhoAmIMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('whoami')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const clues = buildClues(target)
  const revealedCount = isFinished ? clues.length : Math.min(wrongGuesses.length + 1, clues.length)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="whoami" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6">
            <p className="text-center text-lol-gold text-lg font-semibold mb-4">Who am I?</p>
            <div className="space-y-2">
              {clues.map((clue, i) => (
                <div
                  key={clue.label}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-500 ${
                    i < revealedCount
                      ? 'bg-lol-darker border border-lol-border'
                      : 'bg-lol-darker/30 border border-transparent'
                  }`}
                >
                  <span className="text-lg w-7 text-center">{i < revealedCount ? clue.icon : '🔒'}</span>
                  <span className="text-sm text-lol-text w-20">{clue.label}</span>
                  <span className={`text-sm font-medium transition-all duration-500 ${
                    i < revealedCount ? 'text-lol-text-light' : 'text-lol-text/20 blur-sm select-none'
                  }`}>
                    {i < revealedCount ? clue.value : '???'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-lol-text text-xs mt-3">
              {revealedCount} / {clues.length} clues revealed
            </p>
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Guess the champion..." hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
