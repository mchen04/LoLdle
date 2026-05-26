import { useState, useEffect, useRef } from 'react'
import type { GameMode, AppSettings } from './types/champion'
import { loadChampions, getChampions } from './data'
import { ClassicMode } from './modes/ClassicMode'
import { QuoteMode } from './modes/QuoteMode'
import { AbilityMode } from './modes/AbilityMode'
import { EmojiMode } from './modes/EmojiMode'
import { SplashMode } from './modes/SplashMode'
import { TitleMode } from './modes/TitleMode'
import { PixelMode } from './modes/PixelMode'
import { SpellNameMode } from './modes/SpellNameMode'
import { FeetMode } from './modes/FeetMode'
import { WhoAmIMode } from './modes/WhoAmIMode'
import { AnagramMode } from './modes/AnagramMode'
import { MissingLettersMode } from './modes/MissingLettersMode'
import { SkinNameMode } from './modes/SkinNameMode'
import { AllAbilitiesMode } from './modes/AllAbilitiesMode'
import { ZoomedIconMode } from './modes/ZoomedIconMode'
import { WarpedMode } from './modes/WarpedMode'
import { ColorShiftMode } from './modes/ColorShiftMode'
import { BackwardsQuoteMode } from './modes/BackwardsQuoteMode'
import { PassiveMode } from './modes/PassiveMode'
import { SettingsModal } from './components/SettingsModal'
import { StatsModal } from './components/StatsModal'
import { loadSettings, saveSettings } from './utils/storage'

const MODES: { key: GameMode; label: string; icon: string }[] = [
  { key: 'classic', label: 'Classic', icon: '🎯' },
  { key: 'quote', label: 'Quote', icon: '💬' },
  { key: 'ability', label: 'Ability', icon: '✨' },
  { key: 'emoji', label: 'Emoji', icon: '😀' },
  { key: 'splash', label: 'Splash', icon: '🖼️' },
  { key: 'title', label: 'Title', icon: '👑' },
  { key: 'pixel', label: 'Pixel', icon: '🔲' },
  { key: 'spellName', label: 'Spell', icon: '📜' },
  { key: 'feet', label: 'Feet', icon: '🦶' },
  { key: 'whoami', label: 'Who?', icon: '🕵️' },
  { key: 'anagram', label: 'Anagram', icon: '🔤' },
  { key: 'missingLetters', label: 'Fill In', icon: '🔡' },
  { key: 'skinName', label: 'Skin', icon: '🎨' },
  { key: 'allAbilities', label: 'Kit', icon: '🃏' },
  { key: 'zoomedIcon', label: 'Zoomed', icon: '🔍' },
  { key: 'warped', label: 'Warped', icon: '🌀' },
  { key: 'colorShift', label: 'Colors', icon: '🌈' },
  { key: 'backwardsQuote', label: 'Scramble', icon: '🔀' },
  { key: 'passive', label: 'Passive', icon: '💠' },
]

const MODE_COMPONENT: Record<GameMode, React.FC<{ settings: AppSettings }>> = {
  classic: ClassicMode,
  quote: QuoteMode,
  ability: AbilityMode,
  emoji: EmojiMode,
  splash: SplashMode,
  title: TitleMode,
  pixel: PixelMode,
  spellName: SpellNameMode,
  feet: FeetMode,
  whoami: WhoAmIMode,
  anagram: AnagramMode,
  missingLetters: MissingLettersMode,
  skinName: SkinNameMode,
  allAbilities: AllAbilitiesMode,
  zoomedIcon: ZoomedIconMode,
  warped: WarpedMode,
  colorShift: ColorShiftMode,
  backwardsQuote: BackwardsQuoteMode,
  passive: PassiveMode,
}

export default function App() {
  const [activeMode, setActiveMode] = useState<GameMode>('classic')
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChampions().then(() => setReady(true))
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettings(false)
        setShowStats(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (!ready || getChampions().length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lol-text text-lg">Loading champions...</p>
      </div>
    )
  }

  const ActiveComponent = MODE_COMPONENT[activeMode]
  const activeLabel = MODES.find(m => m.key === activeMode)

  const selectMode = (key: GameMode) => {
    setActiveMode(key)
    setMenuOpen(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-lol-darker border-b border-lol-border z-40">
        {/* Top bar: always visible */}
        <div className="flex items-center justify-between px-3 h-11">
          <div className="flex items-center gap-2">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-1.5 -ml-1 text-lol-text hover:text-lol-text-light transition-colors"
              aria-label="Toggle game modes menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                {menuOpen ? (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                )}
              </svg>
            </button>
            <h1 className="text-lg font-bold tracking-wide">
              <span className="text-lol-gold">LoL</span>
              <span className="text-lol-text-light">dle</span>
            </h1>
            {/* Current mode badge - mobile only */}
            <span className="md:hidden text-xs text-lol-gold bg-lol-gold/10 px-2 py-0.5 rounded-full font-medium">
              {activeLabel?.icon} {activeLabel?.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStats(true)}
              className="p-1.5 text-lol-text hover:text-lol-text-light transition-colors"
              aria-label="Statistics"
              title="Statistics"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor"/>
                <rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor"/>
                <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor"/>
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-lol-text hover:text-lol-text-light transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex flex-wrap gap-1 justify-center px-3 pb-2" role="tablist">
          {MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => selectMode(mode.key)}
              role="tab"
              aria-selected={activeMode === mode.key}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all
                ${activeMode === mode.key
                  ? 'bg-lol-gold/20 text-lol-gold ring-1 ring-lol-gold/30'
                  : 'text-lol-text hover:text-lol-text-light hover:bg-lol-card'
                }`}
            >
              <span className="text-sm leading-none">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile mode drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div ref={menuRef} className="relative mt-11 mx-2 drawer-in">
            <div className="bg-lol-card border border-lol-border rounded-xl p-3 shadow-2xl max-h-[70svh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-1.5">
                {MODES.map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => selectMode(mode.key)}
                    className={`flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg text-center transition-all
                      ${activeMode === mode.key
                        ? 'bg-lol-gold/20 text-lol-gold ring-1 ring-lol-gold/30'
                        : 'text-lol-text hover:text-lol-text-light hover:bg-lol-card-hover active:bg-lol-card-hover'
                      }`}
                  >
                    <span className="text-xl leading-none">{mode.icon}</span>
                    <span className="text-[10px] font-medium leading-tight">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main game area - fills remaining space, never scrolls at page level */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto px-3 py-2 sm:py-3">
          <ActiveComponent settings={settings} />
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  )
}
