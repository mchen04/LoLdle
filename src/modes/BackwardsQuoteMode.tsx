import { useMemo } from 'react'
import { useGame } from '../hooks/useGame'
import { ChampionSearch } from '../components/ChampionSearch'
import { VictoryState } from '../components/VictoryState'
import { WrongGuesses } from '../components/WrongGuesses'
import { GiveUpButton } from '../components/GiveUpButton'
import { getWrongGuesses } from '../data'
import { hashCode } from '../utils/gameLogic'
import type { AppSettings } from '../types/champion'

function shuffleWords(words: string[], seed: number): string[] {
  const result = [...words]
  let s = Math.abs(seed)
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff)
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function BackwardsQuoteMode({ settings }: { settings: AppSettings }) {
  const { target, guessIds, solved, givenUp, guessCount, extras, submitGuess, nextRound, giveUp, updateExtra } = useGame('backwardsQuote')

  const { scrambledWords, originalWords } = useMemo(() => {
    if (!target.quote) return { scrambledWords: [], originalWords: [] }
    const words = target.quote.split(/\s+/).filter(w => w.length > 0)
    const scrambled = shuffleWords(words, hashCode(target.id + 'bquote'))
    return { scrambledWords: scrambled, originalWords: words }
  }, [target])

  if (!target.quote) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const hintRevealed = !!extras.hintRevealed
  const fixedCount = Math.min(wrongGuesses.length, originalWords.length - 2)

  const displayWords = (() => {
    if (fixedCount === 0) return scrambledWords.map(w => ({ text: w, fixed: false }))
    const fixed = originalWords.slice(0, fixedCount)
    const fixedSet = [...fixed]
    const remaining = scrambledWords.filter(w => {
      const idx = fixedSet.indexOf(w)
      if (idx !== -1) { fixedSet.splice(idx, 1); return false }
      return true
    })
    let ri = 0
    return originalWords.map((w, i) => {
      if (i < fixedCount) return { text: w, fixed: true }
      return { text: remaining[ri++] || w, fixed: false }
    })
  })()

  return (
    <div className="flex flex-col h-full gap-2 max-w-lg mx-auto">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 justify-center">
        {isFinished ? (
          <VictoryState champion={target} mode="backwardsQuote" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
        ) : (
          <>
            <div className="w-full bg-lol-card border border-lol-border rounded-xl p-4 sm:p-5 text-center">
              <p className="text-lol-text text-xs mb-3">The words in this quote have been scrambled. Who said it?</p>
              <blockquote className="text-base sm:text-lg text-lol-text-light italic leading-relaxed">
                &ldquo;{displayWords.map((w, i) => (
                  <span key={i} className={w.fixed ? 'text-lol-green' : ''}>
                    {w.text}{i < displayWords.length - 1 ? ' ' : ''}
                  </span>
                ))}&rdquo;
              </blockquote>
              {fixedCount > 0 && (
                <p className="text-lol-text text-[10px] mt-1">{fixedCount} word{fixedCount > 1 ? 's' : ''} unscrambled</p>
              )}
              {hintRevealed && (
                <div className="mt-2 pt-2 border-t border-lol-border">
                  <span className="text-lol-text text-xs">Region: </span>
                  <span className="text-lol-gold text-xs font-medium">{target.regions.join(' / ')}</span>
                </div>
              )}
              {!hintRevealed && wrongGuesses.length >= 3 && (
                <button onClick={() => updateExtra('hintRevealed', true)} className="mt-2 text-xs text-lol-text hover:text-lol-gold transition-colors underline">
                  Reveal region hint
                </button>
              )}
            </div>
          </>
        )}
        <WrongGuesses guesses={wrongGuesses} />
      </div>

      {!isFinished && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-full">
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Who said this?" hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </div>
      )}
    </div>
  )
}
