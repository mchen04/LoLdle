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
    if (!target?.quote) return { scrambledWords: [], originalWords: [] }
    const words = target.quote.split(/\s+/).filter(w => w.length > 0)
    const scrambled = shuffleWords(words, hashCode(target.id + 'bquote'))
    return { scrambledWords: scrambled, originalWords: words }
  }, [target])

  if (!target || !target.quote) return null

  const wrongGuesses = getWrongGuesses(guessIds, target.id)
  const isFinished = solved || givenUp
  const hintRevealed = !!extras.hintRevealed
  // Each wrong guess fixes one word into its correct position
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
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {isFinished ? (
        <VictoryState champion={target} mode="backwardsQuote" guessCount={guessCount} givenUp={givenUp} onNextRound={nextRound} />
      ) : (
        <>
          <div className="w-full bg-lol-card border border-lol-border rounded-xl p-6 text-center">
            <p className="text-lol-text text-sm mb-4">The words in this quote have been scrambled. Who said it?</p>
            <blockquote className="text-xl md:text-2xl text-lol-text-light italic leading-relaxed">
              &ldquo;{displayWords.map((w, i) => (
                <span key={i} className={w.fixed ? 'text-lol-green' : ''}>
                  {w.text}{i < displayWords.length - 1 ? ' ' : ''}
                </span>
              ))}&rdquo;
            </blockquote>
            {fixedCount > 0 && (
              <p className="text-lol-text text-xs mt-2">
                {fixedCount} word{fixedCount > 1 ? 's' : ''} unscrambled
              </p>
            )}
            {hintRevealed && (
              <div className="mt-3 pt-3 border-t border-lol-border">
                <span className="text-lol-text text-sm">Region: </span>
                <span className="text-lol-gold text-sm font-medium">{target.regions.join(' / ')}</span>
              </div>
            )}
            {!hintRevealed && wrongGuesses.length >= 3 && (
              <button
                onClick={() => updateExtra('hintRevealed', true)}
                className="mt-3 text-sm text-lol-text hover:text-lol-gold transition-colors underline"
              >
                Reveal region hint
              </button>
            )}
          </div>
          <ChampionSearch onSelect={submitGuess} usedIds={guessIds} placeholder="Who said this?" hardMode={settings.hardMode} />
          <GiveUpButton onClick={giveUp} />
        </>
      )}
      <WrongGuesses guesses={wrongGuesses} />
    </div>
  )
}
