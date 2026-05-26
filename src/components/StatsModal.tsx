import type { GameMode } from '../types/champion'
import { loadModeStats } from '../utils/storage'

const MODES: { key: GameMode; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'quote', label: 'Quote' },
  { key: 'ability', label: 'Ability' },
  { key: 'emoji', label: 'Emoji' },
  { key: 'splash', label: 'Splash' },
  { key: 'title', label: 'Title' },
  { key: 'pixel', label: 'Pixel' },
  { key: 'spellName', label: 'Spell' },
  { key: 'feet', label: 'Feet' },
  { key: 'whoami', label: 'Who Am I?' },
  { key: 'anagram', label: 'Anagram' },
  { key: 'missingLetters', label: 'Fill In' },
  { key: 'skinName', label: 'Skin Name' },
  { key: 'allAbilities', label: 'Full Kit' },
  { key: 'zoomedIcon', label: 'Zoomed Icon' },
  { key: 'warped', label: 'Warped' },
  { key: 'colorShift', label: 'Color Shift' },
  { key: 'backwardsQuote', label: 'Scramble' },
  { key: 'passive', label: 'Passive' },
]

interface Props {
  onClose: () => void
}

export function StatsModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-lol-card border border-lol-border rounded-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-lol-text-light">Statistics</h2>
          <button
            onClick={onClose}
            className="text-lol-text hover:text-lol-text-light text-xl leading-none"
            aria-label="Close stats"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          {MODES.map(({ key, label }) => {
            const stats = loadModeStats(key)
            return (
              <div key={key} className="bg-lol-darker rounded-lg p-3">
                <h3 className="text-sm font-medium text-lol-gold mb-2">{label}</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <StatBox label="Played" value={stats.gamesPlayed} />
                  <StatBox label="Win Rate" value={
                    stats.gamesPlayed > 0
                      ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
                      : '-'
                  } />
                  <StatBox label="Best" value={
                    stats.bestScore === Infinity ? '-' : stats.bestScore
                  } />
                  <StatBox label="Streak" value={stats.currentStreak} />
                  <StatBox label="Best Streak" value={stats.bestStreak} />
                  <StatBox label="Avg Guesses" value={
                    stats.gamesWon > 0
                      ? (stats.totalGuesses / stats.gamesWon).toFixed(1)
                      : '-'
                  } />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-lg font-semibold text-lol-text-light">{value}</div>
      <div className="text-[10px] text-lol-text uppercase">{label}</div>
    </div>
  )
}
