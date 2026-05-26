import type { Champion } from '../types/champion'

interface Props {
  guesses: Champion[]
}

export function WrongGuesses({ guesses }: Props) {
  if (guesses.length === 0) return null

  return (
    <div className="w-full space-y-2">
      <p className="text-xs text-lol-text uppercase tracking-wider">Wrong guesses</p>
      <div className="flex flex-wrap gap-2">
        {guesses.map(c => (
          <div key={c.id} className="flex items-center gap-2 bg-lol-red/30 px-3 py-1.5 rounded-lg">
            <img src={c.icon} alt="" className="w-6 h-6 rounded" />
            <span className="text-sm text-lol-text-light">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
