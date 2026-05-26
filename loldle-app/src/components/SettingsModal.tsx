import type { AppSettings } from '../types/champion'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onChange, onClose }: Props) {
  const toggle = (key: keyof AppSettings) => {
    onChange({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-lol-card border border-lol-border rounded-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-lol-text-light">Settings</h2>
          <button
            onClick={onClose}
            className="text-lol-text hover:text-lol-text-light text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Colorblind Mode"
            description="Use blue/yellow instead of green/orange"
            checked={settings.colorblind}
            onChange={() => toggle('colorblind')}
          />
          <ToggleRow
            label="Scale to Fit"
            description="Scale Classic grid to fit screen width"
            checked={settings.scaleToFit}
            onChange={() => toggle('scaleToFit')}
          />
          <ToggleRow
            label="Click to Guess"
            description="Click autocomplete option to submit guess"
            checked={settings.clickToGuess}
            onChange={() => toggle('clickToGuess')}
          />
          <ToggleRow
            label="Hard Mode"
            description="Hide champion names in search results"
            checked={settings.hardMode}
            onChange={() => toggle('hardMode')}
          />
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-sm text-lol-text-light group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-lol-text">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-lol-gold' : 'bg-lol-border'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
