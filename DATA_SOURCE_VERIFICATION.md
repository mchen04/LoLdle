# Data Source Verification

## Primary Source: Riot Data Dragon (v14.24.1)
- **Endpoint tested:** `https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion.json`
- **Champion detail:** `https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion/{id}.json`
- **Fields verified:**
  - Full champion roster: 169 champions ✓
  - Canonical names and IDs ✓
  - Champion square icons (via `img/champion/{id}.png`) ✓
  - Splash art (via `img/champion/splash/{id}_0.jpg`) ✓
  - Skin splash art (via `img/champion/splash/{id}_{num}.jpg`) ✓
  - Ability icons (passive via `img/passive/{file}`, spells via `img/spell/{file}`) ✓
  - Ability slot labels (passive + Q/W/E/R from `spells` array order) ✓
  - Resource type (`partype` field) ✓
  - Tags/roles (fighter, mage, etc.) ✓

## Secondary Source: Meraki Analytics
- **Endpoint tested:** `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/{id}.json`
- **Fields verified:**
  - Release date (parsed to year) ✓
  - Attack type (MELEE/RANGED) ✓
  - Positions (TOP/JUNGLE/MIDDLE/BOTTOM/SUPPORT) ✓

## Gaps Requiring Curated Supplement
Data Dragon and Meraki do not provide these LoLdle-specific fields:
- **Gender** — Not in any API. Derived from champion lore.
- **Species** — Not a discrete field. Categorized from lore descriptions (Human, Yordle, Vastaya, Darkin, Void, etc.)
- **Region(s)** — Meraki has `faction` but it's often "unaffiliated." Curated from lore.
- **Quotes** — CommunityDragon has audio file paths but no text transcriptions.
- **Emoji clues** — Entirely original content for the Emoji game mode.

## Supplement Details
- File: `scripts/champion-supplement.json` (merged from 4 part files)
- 168 champions with curated gender, species, regions, quotes, and emoji clues
- 3 additional champions (Bel'Veth, Rell, Renata Glasc) patched inline due to ID mismatches
- Total: 169 champions fully covered

## Data Pipeline
1. `scripts/fetch-champions.mjs` — Fetches from Data Dragon + Meraki, merges with supplement
2. `scripts/seed-supabase.mjs` — Seeds Supabase from the generated `champions.json`
3. Output: `src/data/champions.json` — Static JSON used by the app as primary data source
4. Supabase tables mirror the JSON for server-backed queries if needed

## Manual Refresh Command
```bash
cd loldle-app
# Re-fetch from APIs and regenerate champions.json
node scripts/fetch-champions.mjs

# Re-seed Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-supabase.mjs
```

## Verification
- Supabase champions table: 169 rows
- Supabase abilities table: 845 rows (5 per champion × 169)
- Supabase skins table: 799 rows
- All champion icons load from Data Dragon CDN
- All splash arts load from Data Dragon CDN
- Ability icons load for most champions (some use non-standard filenames)
