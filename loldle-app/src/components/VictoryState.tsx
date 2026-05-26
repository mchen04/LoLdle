import { useState } from 'react'
import type { Champion, GameMode } from '../types/champion'
import { generateShareText } from '../utils/storage'

interface Props {
  champion: Champion
  mode: GameMode
  guessCount: number
  onNextRound: () => void
}

export function VictoryState({ champion, mode, guessCount, onNextRound }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    const text = generateShareText(mode, guessCount, true)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 slide-down">
      <div className="relative">
        <img
          src={champion.splash}
          alt={champion.name}
          className="w-48 h-28 object-cover rounded-lg border-2 border-lol-gold shadow-lg"
        />
        <div className="absolute -top-3 -right-3 bg-lol-green text-white text-xs font-bold px-2 py-1 rounded-full">
          {guessCount === 1 ? '1 guess' : `${guessCount} guesses`}
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-lol-gold">{champion.name}</h3>
        <p className="text-lol-text text-sm italic">{champion.title}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNextRound}
          className="px-6 py-2.5 bg-lol-gold text-lol-dark font-semibold rounded-lg
                     hover:bg-lol-text-light transition-colors"
        >
          Next Round
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2.5 bg-lol-card border border-lol-border rounded-lg
                     text-lol-text-light hover:bg-lol-card-hover transition-colors"
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>
    </div>
  )
}
