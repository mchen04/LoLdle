import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import type { AppSettings } from '../types/champion'

export function FeetMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, submitGuess, nextRound, giveUp } = useGame('feet')

  if (!target) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const feetSrc = `/feet/${target.id}.jpg`

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="feet" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <p className="text-lol-text text-sm">Guess the champion from their feet</p>
            <div className="bg-lol-card border-2 border-lol-border rounded-xl p-3">
              <img
                src={feetSrc}
                alt="Mystery champion feet"
                className="rounded-lg max-w-64"
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="308" height="90"><rect fill="%231a1f2e" width="308" height="90" rx="8"/><text x="154" y="50" text-anchor="middle" fill="%23a09b8c" font-size="14">?</text></svg>'
                }}
              />
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
