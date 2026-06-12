// Copies all game data from Supabase to Neon.
// Usage: NEON_DATABASE_URL=postgres://... node scripts/migrate-supabase-to-neon.mjs
// Reads Supabase creds from .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
)

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY
const NEON_URL = process.env.NEON_DATABASE_URL
if (!NEON_URL) {
  console.error('Set NEON_DATABASE_URL')
  process.exit(1)
}

const sql = neon(NEON_URL)

async function fetchAll(table) {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${table === 'abilities' ? 'id' : table === 'sync_meta' ? 'key' : 'id'}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Range: `${from}-${from + page - 1}`,
      },
    })
    if (res.status === 401 || res.status === 403) {
      console.warn(`${table}: not readable with anon key, skipping`)
      return rows
    }
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
    const batch = await res.json()
    rows.push(...batch)
    if (batch.length < page) break
  }
  return rows
}

const champions = await fetchAll('champions')
const abilities = await fetchAll('abilities')
const skins = await fetchAll('skins')
const syncMeta = await fetchAll('sync_meta')
console.log(`Fetched from Supabase: ${champions.length} champions, ${abilities.length} abilities, ${skins.length} skins, ${syncMeta.length} sync_meta`)

await sql`truncate public.abilities, public.skins, public.champions, public.sync_meta`

for (const c of champions) {
  await sql`insert into public.champions (id, name, title, gender, positions, species, resource, range_type, regions, release_year, icon_url, splash_url, quote, emoji_clue, created_at, updated_at)
    values (${c.id}, ${c.name}, ${c.title}, ${c.gender}, ${c.positions}, ${c.species}, ${c.resource}, ${c.range_type}, ${c.regions}, ${c.release_year}, ${c.icon_url}, ${c.splash_url}, ${c.quote}, ${c.emoji_clue}, ${c.created_at}, ${c.updated_at})`
}
console.log('champions inserted')

for (let i = 0; i < abilities.length; i += 200) {
  const batch = abilities.slice(i, i + 200)
  await Promise.all(batch.map(a =>
    sql`insert into public.abilities (champion_id, name, icon_url, slot) values (${a.champion_id}, ${a.name}, ${a.icon_url}, ${a.slot})`
  ))
}
console.log('abilities inserted')

for (let i = 0; i < skins.length; i += 200) {
  const batch = skins.slice(i, i + 200)
  await Promise.all(batch.map(s =>
    sql`insert into public.skins (id, champion_id, name, splash_url) values (${s.id}, ${s.champion_id}, ${s.name}, ${s.splash_url})`
  ))
}
console.log('skins inserted')

for (const m of syncMeta) {
  await sql`insert into public.sync_meta (key, value, updated_at) values (${m.key}, ${m.value}, ${m.updated_at})`
}

const counts = await sql`select
  (select count(*) from champions) as champions,
  (select count(*) from abilities) as abilities,
  (select count(*) from skins) as skins,
  (select count(*) from sync_meta) as sync_meta`
console.log('Neon counts:', counts[0])
