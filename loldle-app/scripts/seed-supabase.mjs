#!/usr/bin/env node
// Seeds the Supabase database with champion data from champions.json
// Usage: node scripts/seed-supabase.mjs
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars,
// or uses supabase CLI to get the project URL.

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wujckwchvygpzlltfmbm.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable')
  console.error('You can find these in: supabase dashboard > Settings > API')
  process.exit(1)
}

async function supabaseRequest(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path}: ${res.status} ${text}`)
  }
  return res
}

async function main() {
  const championsPath = join(__dirname, '..', 'src', 'data', 'champions.json')
  const champions = JSON.parse(readFileSync(championsPath, 'utf-8'))
  console.log(`Seeding ${champions.length} champions...`)

  // Upsert champions
  const championRows = champions.map(c => ({
    id: c.id,
    name: c.name,
    title: c.title,
    gender: c.gender,
    positions: c.positions,
    species: c.species,
    resource: c.resource,
    range_type: c.rangeType,
    regions: c.regions,
    release_year: c.releaseYear,
    icon_url: c.icon,
    splash_url: c.splash,
    quote: c.quote,
    emoji_clue: c.emojiClue,
  }))

  // Batch upsert in groups of 50
  for (let i = 0; i < championRows.length; i += 50) {
    const batch = championRows.slice(i, i + 50)
    await supabaseRequest('champions', 'POST', batch)
    process.stdout.write(`\rChampions: ${Math.min(i + 50, championRows.length)}/${championRows.length}`)
  }
  console.log(' ✓')

  // Upsert abilities
  const abilityRows = []
  for (const c of champions) {
    for (const a of c.abilities || []) {
      abilityRows.push({
        champion_id: c.id,
        name: a.name,
        icon_url: a.icon,
        slot: a.slot,
      })
    }
  }

  // Delete existing abilities first (serial PK can't upsert easily)
  await supabaseRequest('abilities?id=gt.0', 'DELETE')
  for (let i = 0; i < abilityRows.length; i += 50) {
    const batch = abilityRows.slice(i, i + 50)
    await supabaseRequest('abilities', 'POST', batch)
    process.stdout.write(`\rAbilities: ${Math.min(i + 50, abilityRows.length)}/${abilityRows.length}`)
  }
  console.log(' ✓')

  // Upsert skins
  const skinRows = []
  for (const c of champions) {
    for (const s of c.skins || []) {
      skinRows.push({
        id: s.id,
        champion_id: c.id,
        name: s.name,
        splash_url: s.splash,
      })
    }
  }

  for (let i = 0; i < skinRows.length; i += 50) {
    const batch = skinRows.slice(i, i + 50)
    await supabaseRequest('skins', 'POST', batch)
    process.stdout.write(`\rSkins: ${Math.min(i + 50, skinRows.length)}/${skinRows.length}`)
  }
  console.log(' ✓')

  console.log('Seeding complete!')
}

main().catch(e => { console.error(e); process.exit(1) })
