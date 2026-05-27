# LoLdle

A League of Legends champion guessing game with 19 game modes, fully responsive across all devices.

## Game Modes

| Mode | Mechanic |
|------|----------|
| **Classic** | Guess a champion; get color-coded feedback on 8 attributes (gender, position, species, resource, range, region, year) |
| **Quote** | Identify a champion from an in-game quote. Region hint after 3 guesses |
| **Ability** | Identify a champion from a greyscaled, rotated ability icon. Restore color / fix rotation as hints |
| **Emoji** | Guess from emoji clues revealed one at a time (up to 5) |
| **Splash** | Identify from a greyscaled, zoomed-in splash art that progressively zooms out |
| **Title** | Guess the champion from their title. Hints: first letter, region, species |
| **Pixel** | Identify a champion from a heavily blurred icon that clears with each guess |
| **Spell** | Identify a champion from an ability name. Hints: ability slot, second ability |
| **Feet** | Guess the champion from a cropped image of their feet |
| **Who Am I?** | 7 champion attributes revealed one at a time (range, resource, gender, position, species, region, year) |
| **Anagram** | Unscramble the champion name; letters lock into place with each wrong guess |
| **Fill In** | Fill in missing letters (~60% hidden); letters reveal with each wrong guess |
| **Skin** | Guess the champion from a skin name (champion name stripped). Blurred splash hint after 3 guesses |
| **Kit** | Identify from the full 5-ability kit (greyscaled). Restore color / show names as hints |
| **Zoomed** | Guess from a heavily zoomed champion icon that zooms out with each guess |
| **Warped** | Identify from a perspective-warped, color-shifted splash art that unwarps with guesses |
| **Colors** | Guess from a hue-shifted champion icon that returns to true colors with guesses |
| **Scramble** | Quote with words in random order; words lock into place with each wrong guess |
| **Passive** | Identify a champion from their passive ability icon. Hints: passive name, region |

All modes support **Give Up** (reveals answer, breaks streak) and **Next Round** (infinite play).

## Features

- **Fully responsive** — works on all screen sizes from 320px phones to desktop, including landscape
- **No scrolling required** — every mode fits on a single screen; search bar pinned at bottom
- **Viewport-aware dropdown** — champion search suggestions flip above the input when near the viewport edge, with dynamic height capping and mobile keyboard support via `visualViewport` API
- **Hamburger menu on mobile** — 3-column grid of mode buttons with emoji icons; desktop shows inline tabs
- **Settings** — Colorblind mode, Scale to Fit (Classic grid), Click to Guess, Hard Mode (hides champion names)
- **Statistics** — Per-mode tracking: games played, win rate, best score, streaks, average guesses
- **Share** — Copy emoji result grid to clipboard
- **Persistent progress** — Game state and stats saved to localStorage

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Supabase (database + Edge Functions for auto-updates)

## Data Sources

| Field | Primary Source | Fallback |
|---|---|---|
| Name, title, icon, splash, abilities, skins, resource | Riot Data Dragon (auto-detected latest version) | — |
| Positions, release year, range type | Meraki Analytics CDN | DD tags/stats |
| Quote, species (races), region (faction) | Riot Universe API | Supplement JSON |
| Gender | Pronoun detection from DD lore text | Supplement JSON |
| Emoji clues | Tag/species/region-based generation | Supplement JSON |

The `champion-supplement.json` file provides curated overrides for all fields. When present, supplement data takes priority over auto-populated values.

## Setup

```bash
npm install
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build
```

## Data Pipeline

```bash
node scripts/fetch-champions.mjs   # Fetch latest DD + Meraki + Universe data → src/data/champions.json
node scripts/seed-supabase.mjs     # Seed Supabase DB from champions.json
```

The fetch script auto-detects the latest Data Dragon version. New champions are auto-populated from Universe API (quotes, species, regions) and heuristics (gender, emoji).

## Auto-Updates (Supabase)

A deployed Edge Function (`sync-champions`) syncs champion data daily:

1. Checks latest DD version against `sync_meta` table
2. If new version detected, fetches all champion data from DD + Meraki + Universe API
3. Upserts champions, abilities, and skins into Supabase

Enable `pg_cron` + `pg_net` extensions in Supabase dashboard, then uncomment the cron schedule in the migration file to activate daily auto-sync.

## Project Structure

```
├── src/
│   ├── modes/          # 19 game mode components
│   ├── components/     # Shared UI (ChampionSearch, VictoryState, WrongGuesses, modals)
│   ├── hooks/          # useGame hook (state + persistence)
│   ├── utils/          # Game logic, storage, Supabase client
│   ├── types/          # TypeScript interfaces
│   └── data/           # champions.json + data access functions
├── scripts/            # Data fetching and seeding scripts
├── supabase/
│   ├── functions/      # Edge Functions (sync-champions)
│   └── migrations/     # Database schema
└── public/
    └── feet/           # Champion feet images for Feet mode
```
