#!/usr/bin/env node
// Fetches champion data from Data Dragon + Meraki Analytics + Riot Universe,
// merges with local supplement, and outputs src/data/champions.json
//
// Auto-populates gender, species, regions, quotes, and emoji clues for any
// champion missing from the supplement using Universe API + heuristics.

import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MERAKI_BASE = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions'
const UNIVERSE_BASE = 'https://universe-meeps.leagueoflegends.com/v1/en_us/champions'

const FACTION_MAP = {
  'demacia': 'Demacia', 'noxus': 'Noxus', 'ionia': 'Ionia',
  'shurima': 'Shurima', 'freljord': 'Freljord', 'zaun': 'Zaun',
  'piltover': 'Piltover', 'shadow-isles': 'Shadow Isles', 'void': 'The Void',
  'mount-targon': 'Targon', 'bilgewater': 'Bilgewater', 'bandle-city': 'Bandle City',
  'ixtal': 'Ixtal', 'unaffiliated': 'Runeterra', 'camavor': 'Camavor',
  'icathia': 'Icathia', 'blessed-isles': 'Blessed Isles',
}

const ROLE_EMOJI = { Fighter: '⚔️', Mage: '🔮', Tank: '🛡️', Assassin: '🗡️', Marksman: '🏹', Support: '💚' }
const RACE_EMOJI = {
  Darkin: '😈', Yordle: '🐹', Vastaya: '🦊', Void: '🌀', Celestial: '⭐',
  Undead: '💀', Spirit: '👻', Dragon: '🐉', Human: '👤', Ascended: '☀️',
  Golem: '🗿', Demon: '👹', 'God-Warrior': '⚡',
}
const REGION_EMOJI = {
  Demacia: '⚜️', Noxus: '🔴', Ionia: '🌸', Freljord: '❄️',
  'Shadow Isles': '👻', 'The Void': '🟣', Shurima: '🏜️',
  Piltover: '⚙️', Zaun: '🧪', Bilgewater: '🏴‍☠️', Targon: '🏔️',
  'Bandle City': '🍄', Ixtal: '🌿', Runeterra: '🌍',
}

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function fetchOptional(url) {
  try { return await fetchJSON(url) } catch { return null }
}

function detectGender(loreText) {
  if (!loreText) return 'Male'
  const lower = loreText.toLowerCase()
  const she = (lower.match(/\b(she|her|hers|herself)\b/g) || []).length
  const he = (lower.match(/\b(he|him|his|himself)\b/g) || []).length
  const they = (lower.match(/\b(they|them|their|themself)\b/g) || []).length
  if (they > she && they > he) return 'Non-binary'
  if (she > he) return 'Female'
  return 'Male'
}

function generateEmoji(roles, species, region) {
  const parts = []
  const roleEmoji = roles.map(r => ROLE_EMOJI[r]).filter(Boolean)
  if (roleEmoji.length) parts.push(roleEmoji[0])
  const specEmoji = species.map(s => RACE_EMOJI[s]).filter(Boolean)
  if (specEmoji.length) parts.push(specEmoji[0])
  const regEmoji = REGION_EMOJI[region]
  if (regEmoji) parts.push(regEmoji)
  if (parts.length < 3) parts.push('❓')
  return parts.slice(0, 4).join('')
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

  const champions = []
  const autoPopulated = []

  for (const id of championIds) {
    process.stdout.write(`\rProcessing ${id}...`.padEnd(60))

    // Fetch detailed DD data
    let ddDetail
    try {
      const ddDetailRes = await fetchJSON(`${DDRAGON_BASE}/data/en_US/champion/${id}.json`)
      ddDetail = ddDetailRes.data[id]
    } catch (e) {
      console.warn(`\nFailed to fetch DD detail for ${id}: ${e.message}`)
      continue
    }

    // Fetch Meraki data
    const meraki = await fetchOptional(`${MERAKI_BASE}/${id}.json`)

    const sup = supplement[id] || supplement[ddDetail.name] || null
    const hasSupplement = sup !== null
    const s = sup || {}

    // If no supplement, fetch Universe API for auto-population
    let universe = null
    if (!hasSupplement) {
      universe = await fetchUniverseData(id, ddDetail.name)
      autoPopulated.push({ id, name: ddDetail.name, hasUniverse: !!universe })
    }

    // --- Resolve each field ---

    // Gender: supplement > Universe pronouns > DD lore pronouns
    let gender = s.gender
    if (!gender) {
      gender = detectGender(ddDetail.lore || ddDetail.blurb || '')
    }

    // Species: supplement > Universe races > default
    let species = s.species
    if (!species || species.length === 0) {
      if (universe?.races?.length) {
        species = universe.races.map(r => r.name)
      } else {
        species = ['Human']
      }
    }

    // Regions: supplement > Universe faction > default
    let regions = s.regions
    if (!regions || regions.length === 0) {
      if (universe) {
        const slug = universe['associated-faction-slug']
        const region = FACTION_MAP[slug] || 'Runeterra'
        regions = [region]
      } else {
        regions = ['Runeterra']
      }
    }

    // Quote: supplement > Universe biography quote > empty
    let quote = s.quote
    if (!quote) {
      if (universe?.biography?.quote) {
        quote = universe.biography.quote
      } else {
        quote = ''
      }
    }

    // Emoji: supplement > auto-generate from tags
    let emojiClue = s.emojiClue
    if (!emojiClue) {
      const ddRoles = ddDetail.tags || []
      emojiClue = generateEmoji(ddRoles, species, regions[0])
    }

    // Release year: Meraki > supplement > default
    let releaseYear = s.releaseYear || 2009
    if (meraki?.releaseDate) {
      releaseYear = new Date(meraki.releaseDate).getFullYear()
    }

    // Positions: Meraki > supplement > DD tags
    let positions = s.positions || []
    if (meraki?.positions) {
      positions = Array.isArray(meraki.positions) ? meraki.positions : [meraki.positions]
      const map = { TOP: 'Top', JUNGLE: 'Jungle', MIDDLE: 'Mid', BOTTOM: 'Bot', SUPPORT: 'Support', MID: 'Mid', ADC: 'Bot' }
      positions = positions.map(p => map[p.toUpperCase()] || p)
    }

    // Range type: Meraki > supplement > DD stats
    let rangeType = s.rangeType || 'Melee'
    if (meraki?.attackType) {
      rangeType = meraki.attackType === 'RANGED' ? 'Ranged' : 'Melee'
    } else if (ddDetail.stats?.attackrange >= 400) {
      rangeType = 'Ranged'
    }

    // Resource: supplement > DD partype
    let resource = ddDetail.partype || 'Mana'
    if (resource === 'None' || resource === '') resource = 'Manaless'
    if (s.resource) resource = s.resource

    // Build abilities
    const abilities = []
    if (ddDetail.passive) {
      abilities.push({
        name: ddDetail.passive.name,
        icon: `${DDRAGON_BASE}/img/passive/${ddDetail.passive.image.full}`,
        slot: 'P'
      })
    }
    const slots = ['Q', 'W', 'E', 'R']
    if (ddDetail.spells) {
      ddDetail.spells.forEach((spell, i) => {
        abilities.push({
          name: spell.name,
          icon: `${DDRAGON_BASE}/img/spell/${spell.image.full}`,
          slot: slots[i]
        })
      })
    }

    // Build skins (all, no cap)
    const skins = (ddDetail.skins || [])
      .filter(s => s.num !== 0)
      .map(s => ({
        id: `${id}_${s.num}`,
        name: s.name === 'default' ? `${ddDetail.name} ${s.num}` : s.name,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_${s.num}.jpg`
      }))

    champions.push({
      id,
      name: ddDetail.name,
      title: ddDetail.title,
      gender,
      positions: positions.length > 0 ? positions : (ddDetail.tags || []),
      species,
      resource,
      rangeType,
      regions,
      releaseYear,
      icon: `${DDRAGON_BASE}/img/champion/${ddDetail.image.full}`,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`,
      abilities,
      skins,
      quote,
      emojiClue
    })
  }

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
