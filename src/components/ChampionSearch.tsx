import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import type { Champion } from '../types/champion'
import { searchChampions } from '../data'

interface Props {
  onSelect: (champion: Champion) => void
  disabled?: boolean
  usedIds?: string[]
  placeholder?: string
  hardMode?: boolean
}

export function ChampionSearch({ onSelect, disabled, usedIds = [], placeholder = 'Type champion name...', hardMode = false }: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const [maxH, setMaxH] = useState(192)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const usedIdSet = useMemo(() => new Set(usedIds), [usedIds])
  const results = useMemo(() => searchChampions(query, usedIdSet), [query, usedIdSet])
  const activeIndex = Math.min(selectedIndex, Math.max(results.length - 1, 0))
  const showResults = isOpen && results.length > 0

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSelectedIndex(0)
    setIsOpen(value.trim().length > 0)
  }, [])

  const handleSelect = useCallback((champion: Champion) => {
    onSelect(champion)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [showResults, results, activeIndex, handleSelect])

  useLayoutEffect(() => {
    if (!showResults || !wrapperRef.current) return

    function recalc() {
      const rect = wrapperRef.current!.getBoundingClientRect()
      const vh = window.visualViewport?.height ?? window.innerHeight
      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      const preferred = 192
      const pad = 8

      if (spaceBelow < preferred && spaceAbove > spaceBelow) {
        setOpenAbove(true)
        setMaxH(Math.max(0, Math.min(preferred, spaceAbove - pad)))
      } else {
        setOpenAbove(false)
        setMaxH(Math.max(0, Math.min(preferred, spaceBelow - pad)))
      }
    }

    recalc()

    const vv = window.visualViewport
    const target = vv ?? window
    target.addEventListener('resize', recalc)
    return () => target.removeEventListener('resize', recalc)
  }, [showResults])

  useEffect(() => {
    if (listRef.current && showResults) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, showResults])

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto flex-shrink-0">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-lol-card border border-lol-border rounded-lg text-lol-text-light
                     placeholder-lol-text focus:outline-none focus:border-lol-gold transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed text-base"
          aria-label="Search champions"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && !disabled && (
          <button
            onClick={() => { setQuery(''); setSelectedIndex(0); setIsOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lol-text hover:text-lol-text-light"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <div
          ref={listRef}
          className={`absolute z-50 w-full bg-lol-card border border-lol-border rounded-lg
                     shadow-xl overflow-y-auto scrollbar-thin
                     ${openAbove ? 'bottom-full mb-1' : 'mt-1'}`}
          style={{ maxHeight: maxH }}
          role="listbox"
        >
          {results.map((champion, i) => (
            <button
              key={champion.id}
              onClick={() => handleSelect(champion)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors
                ${i === activeIndex ? 'bg-lol-card-hover' : 'hover:bg-lol-card-hover'}`}
              role="option"
              aria-selected={i === activeIndex}
            >
              {!hardMode && (
                <img
                  src={champion.icon}
                  alt=""
                  className="w-7 h-7 rounded"
                  loading="lazy"
                />
              )}
              <span className="text-sm text-lol-text-light">{hardMode ? '???' : champion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
