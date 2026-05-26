# LoLdle

A League of Legends champion guessing game with five game modes.

## Game Modes

- **Classic** — Guess a champion; get color-coded feedback on 8 attributes (gender, position, species, resource, range, region, year)
- **Quote** — Identify a champion from an in-game quote. Region hint available after 3 guesses
- **Ability** — Identify a champion from a greyscaled, rotated ability icon. Buttons to restore color and fix rotation as hints
- **Emoji** — Guess the champion from emoji clues revealed one at a time (up to 5)
- **Splash** — Identify a champion from a greyscaled, zoomed-in splash art that progressively zooms out

All modes support **Give Up** (reveals answer, breaks streak) and **Next Round** (infinite play).

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
│   ├── modes/          # 5 game mode components
│   ├── components/     # Shared UI (ChampionSearch, VictoryState, modals)
│   ├── hooks/          # useGame hook (state + persistence)
│   ├── utils/          # Game logic, storage, hash
│   ├── types/          # TypeScript interfaces
│   └── data/           # champions.json + data access functions
├── scripts/            # Data fetching and seeding scripts
├── supabase/
│   ├── functions/      # Edge Functions (sync-champions)
│   └── migrations/     # Database schema
└── public/             # Static assets
```
