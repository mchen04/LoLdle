import { useState, useEffect } from 'react'
import type { GameMode, AppSettings } from './types/champion'
import { ClassicMode } from './modes/ClassicMode'
import { QuoteMode } from './modes/QuoteMode'
import { AbilityMode } from './modes/AbilityMode'
import { EmojiMode } from './modes/EmojiMode'
import { SplashMode } from './modes/SplashMode'
import { SettingsModal } from './components/SettingsModal'
import { StatsModal } from './components/StatsModal'
import { loadSettings, saveSettings } from './utils/storage'

const MODES: { key: GameMode; label: string; icon: string }[] = [
  { key: 'classic', label: 'Classic', icon: '🎯' },
  { key: 'quote', label: 'Quote', icon: '💬' },
  { key: 'ability', label: 'Ability', icon: '✨' },
  { key: 'emoji', label: 'Emoji', icon: '😀' },
  { key: 'splash', label: 'Splash', icon: '🖼️' },
]

export default function App() {
  const [activeMode, setActiveMode] = useState<GameMode>('classic')
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettings(false)
        setShowStats(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-lol-darker/95 backdrop-blur border-b border-lol-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-wide">
              <span className="text-lol-gold">LoL</span>
              <span className="text-lol-text-light">dle</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="p-2 text-lol-text hover:text-lol-text-light transition-colors"
                aria-label="Statistics"
                title="Statistics"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor"/>
                  <rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor"/>
                  <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-lol-text hover:text-lol-text-light transition-colors"
                aria-label="Settings"
                title="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <nav className="flex gap-1 overflow-x-auto scrollbar-thin" role="tablist">
            {MODES.map(mode => (
              <button
                key={mode.key}
                onClick={() => setActiveMode(mode.key)}
                role="tab"
                aria-selected={activeMode === mode.key}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeMode === mode.key
                    ? 'bg-lol-gold/20 text-lol-gold border border-lol-gold/30'
                    : 'text-lol-text hover:text-lol-text-light hover:bg-lol-card'
                  }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeMode === 'classic' && <ClassicMode settings={settings} />}
        {activeMode === 'quote' && <QuoteMode settings={settings} />}
        {activeMode === 'ability' && <AbilityMode settings={settings} />}
        {activeMode === 'emoji' && <EmojiMode settings={settings} />}
        {activeMode === 'splash' && <SplashMode settings={settings} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-lol-border bg-lol-darker/50 py-4 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="text-xs text-lol-text leading-relaxed">
            LoLdle isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games
            or anyone officially involved in producing or managing Riot Games properties.
            Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
          </p>
          <p className="text-xs text-lol-text">
            Champion data from{' '}
            <a href="https://developer.riotgames.com/docs/lol#data-dragon" className="text-lol-gold hover:underline" target="_blank" rel="noopener">
              Riot Data Dragon
            </a>
            {' '}& community sources
          </p>
        </div>
      </footer>

      {/* Modals */}
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
