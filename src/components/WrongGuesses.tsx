import type { Champion } from '../types/champion'

interface Props {
  guesses: Champion[]
}

export function WrongGuesses({ guesses }: Props) {
  if (guesses.length === 0) return null

  return (
    <div className="w-full flex-shrink-0">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
        <span className="text-[10px] text-lol-text uppercase tracking-wider flex-shrink-0">Wrong:</span>
        {guesses.map(c => (
          <div key={c.id} className="flex items-center gap-1 bg-lol-red/20 px-1.5 py-0.5 rounded flex-shrink-0">
            <img src={c.icon} alt="" className="w-5 h-5 rounded" />
            <span className="text-[11px] text-lol-text-light whitespace-nowrap">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
