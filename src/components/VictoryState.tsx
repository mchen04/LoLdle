import { useState } from 'react'
import type { Champion, GameMode } from '../types/champion'
import { generateShareText } from '../utils/storage'

interface Props {
  champion: Champion
  mode: GameMode
  guessCount: number
  givenUp?: boolean
  onNextRound: () => void
}

export function VictoryState({ champion, mode, guessCount, givenUp = false, onNextRound }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    const text = generateShareText(mode, guessCount, true)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 slide-down">
      <div className="relative">
        <img
          src={champion.splash}
          alt={champion.name}
          className={`w-32 h-20 sm:w-44 sm:h-26 object-cover rounded-lg border-2 shadow-lg ${
            givenUp ? 'border-lol-red' : 'border-lol-gold'
          }`}
        />
        <div className={`absolute -top-2 -right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          givenUp ? 'bg-lol-red' : 'bg-lol-green'
        }`}>
          {givenUp
            ? 'Given Up'
            : guessCount === 1 ? '1 guess' : `${guessCount} guesses`
          }
        </div>
      </div>

      <div className="text-center">
        <h3 className={`text-lg sm:text-xl font-bold ${givenUp ? 'text-lol-text-light' : 'text-lol-gold'}`}>
          {champion.name}
        </h3>
        <p className="text-lol-text text-xs italic">{champion.title}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onNextRound}
          className="px-5 py-2 bg-lol-gold text-lol-dark font-semibold rounded-lg
                     hover:bg-lol-text-light transition-colors text-sm"
        >
          Next Round
        </button>
        {!givenUp && (
          <button
            onClick={handleShare}
            className="px-3 py-2 bg-lol-card border border-lol-border rounded-lg
                       text-lol-text-light hover:bg-lol-card-hover transition-colors text-sm"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        )}
      </div>
    </div>
  )
}
