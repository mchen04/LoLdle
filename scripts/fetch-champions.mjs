#!/usr/bin/env node
// Fetches champion data from Data Dragon + Meraki Analytics + Riot Universe,
// merges with local supplement, and outputs src/data/champions.json
//
// Auto-populates gender, species, regions, quotes, and emoji clues for any
// champion missing from the supplement using Universe API + heuristics.

import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  createEmojiGenerator,
  mapWithConcurrency,
  resolveChampionData,
} from '../supabase/functions/_shared/champion-normalizer.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MERAKI_BASE = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions'
const UNIVERSE_BASE = 'https://universe-meeps.leagueoflegends.com/v1/en_us/champions'

const maps = JSON.parse(readFileSync(join(__dirname, 'lib', 'champion-maps.json'), 'utf-8'))
const FACTION_MAP = maps.factionMap
const generateEmoji = createEmojiGenerator({
  roleEmoji: maps.roleEmoji,
  raceEmoji: maps.raceEmoji,
  regionEmoji: maps.regionEmoji,
})

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function fetchOptional(url) {
  try { return await fetchJSON(url) } catch { return null }
}

async function getLatestDDVersion() {
  const versions = await fetchJSON('https://ddragon.leagueoflegends.com/api/versions.json')
  return versions[0]
}

async function fetchUniverseData(ddId, name) {
  // Try DD id lowercase first, then name with non-alpha stripped
  const slugs = [
    ddId.toLowerCase(),
    name.toLowerCase().replace(/[^a-z]/g, ''),
  ]
  for (const slug of [...new Set(slugs)]) {
    const data = await fetchOptional(`${UNIVERSE_BASE}/${slug}/index.json`)
    if (data?.champion) return data.champion
  }
  return null
}

async function resolveChampion(id, context) {
  process.stdout.write(`\rProcessing ${id}...`.padEnd(60))

  let ddDetail
  try {
    const ddDetailRes = await fetchJSON(`${context.ddBase}/data/en_US/champion/${id}.json`)
    ddDetail = ddDetailRes.data[id]
  } catch (e) {
    console.warn(`\nFailed to fetch DD detail for ${id}: ${e.message}`)
    return null
  }

  const [meraki, universe] = await Promise.all([
    fetchOptional(`${MERAKI_BASE}/${id}.json`),
    context.hasSupplement(id, ddDetail.name)
      ? Promise.resolve(null)
      : fetchUniverseData(id, ddDetail.name),
  ])
  const supplement = context.getSupplement(id, ddDetail.name)
  const autoPopulated = supplement ? null : { id, name: ddDetail.name, hasUniverse: !!universe }

  const { champion, skinCandidates } = resolveChampionData({
    id,
    ddDetail,
    meraki,
    supplement: supplement ?? {},
    universe,
    ddBase: context.ddBase,
    factionMap: FACTION_MAP,
    generateEmoji,
  })

  const skinChecks = await Promise.all(skinCandidates.map(async skin => {
    try {
      const res = await fetch(skin.splash, { method: 'HEAD' })
      return res.ok ? skin : null
    } catch { return null }
  }))

  return {
    champion: { ...champion, skins: skinChecks.filter(Boolean) },
    autoPopulated,
  }
}

async function main() {
  const DDRAGON_VERSION = await getLatestDDVersion()
  const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`
  console.log(`Using Data Dragon version: ${DDRAGON_VERSION}`)

  console.log('Fetching Data Dragon champion list...')
  const ddChampions = await fetchJSON(`${DDRAGON_BASE}/data/en_US/champion.json`)
  const championIds = Object.keys(ddChampions.data)
  console.log(`Found ${championIds.length} champions`)

  // Load supplement data
  const supplementPath = join(__dirname, 'champion-supplement.json')
  let supplement = {}
  try {
    supplement = JSON.parse(readFileSync(supplementPath, 'utf-8'))
    console.log(`Loaded supplement data for ${Object.keys(supplement).length} champions`)
  } catch {
    console.warn('No supplement file found, will auto-populate all fields')
  }

  const context = {
    ddBase: DDRAGON_BASE,
    getSupplement: (id, name) => supplement[id] || supplement[name] || null,
    hasSupplement: (id, name) => !!(supplement[id] || supplement[name]),
  }
  const results = await mapWithConcurrency(championIds, 8, id => resolveChampion(id, context))
  const resolved = results.filter(Boolean)
  const champions = resolved.map(result => result.champion)
  const autoPopulated = resolved
    .map(result => result.autoPopulated)
    .filter(Boolean)

  console.log(`\nProcessed ${champions.length} champions`)

  if (autoPopulated.length > 0) {
    console.log(`\n🤖 Auto-populated ${autoPopulated.length} champion(s) without supplement data:`)
    autoPopulated.forEach(c => {
      const tag = c.hasUniverse ? '✓ Universe API' : '⚠ heuristics only'
      console.log(`  ${c.id} (${c.name}) — ${tag}`)
    })
  }

  const outPath = join(__dirname, '..', 'src', 'data', 'champions.json')
  writeFileSync(outPath, JSON.stringify(champions, null, 2))
  console.log(`\nWritten to ${outPath}`)
  console.log(`Data Dragon version: ${DDRAGON_VERSION}`)
}

main().catch(e => { console.error(e); process.exit(1) })
