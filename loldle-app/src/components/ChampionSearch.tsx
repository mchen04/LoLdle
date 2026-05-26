import { useState, useRef, useEffect, useCallback } from 'react'
import type { Champion } from '../types/champion'
import { searchChampions } from '../data'

interface Props {
  onSelect: (champion: Champion) => void
  disabled?: boolean
  usedIds?: string[]
  placeholder?: string
  hardMode?: boolean
}

export function ChampionSearch({ onSelect, disabled, usedIds = [], placeholder = 'Type champion name...', hardMode }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Champion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length > 0) {
      const filtered = searchChampions(query).filter(c => !usedIds.includes(c.id))
      setResults(filtered)
      setIsOpen(filtered.length > 0)
      setSelectedIndex(0)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query, usedIds])

  const handleSelect = useCallback((champion: Champion) => {
    onSelect(champion)
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [isOpen, results, selectedIndex, handleSelect])

  useEffect(() => {
    if (listRef.current && isOpen) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, isOpen])

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-lol-card border border-lol-border rounded-lg text-lol-text-light
                     placeholder-lol-text focus:outline-none focus:border-lol-gold transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed text-base"
          aria-label="Search champions"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && !disabled && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lol-text hover:text-lol-text-light"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-lol-card border border-lol-border rounded-lg
                     shadow-xl max-h-64 overflow-y-auto scrollbar-thin"
          role="listbox"
        >
          {results.map((champion, i) => (
            <button
              key={champion.id}
              onClick={() => handleSelect(champion)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${i === selectedIndex ? 'bg-lol-card-hover' : 'hover:bg-lol-card-hover'}`}
              role="option"
              aria-selected={i === selectedIndex}
            >
              {!hardMode && (
                <img
                  src={champion.icon}
                  alt=""
                  className="w-8 h-8 rounded"
                  loading="lazy"
                />
              )}
              <span className="text-lol-text-light">{hardMode ? '???' : champion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
