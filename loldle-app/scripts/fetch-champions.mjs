#!/usr/bin/env node
// Fetches champion data from Data Dragon + Meraki Analytics,
// merges with local supplement, and outputs src/data/champions.json

import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DDRAGON_VERSION = '14.24.1'
const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`
const MERAKI_BASE = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions'

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function main() {
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
    console.warn('No supplement file found, will use defaults')
  }

  const champions = []

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
    let meraki = null
    try {
      meraki = await fetchJSON(`${MERAKI_BASE}/${id}.json`)
    } catch {
      // Meraki may not have all champions
    }

    const sup = supplement[id] || supplement[ddDetail.name] || {}

    // Parse release year from Meraki or supplement
    let releaseYear = sup.releaseYear || 2009
    if (meraki?.releaseDate) {
      releaseYear = new Date(meraki.releaseDate).getFullYear()
    }

    // Parse positions from Meraki or supplement
    let positions = sup.positions || []
    if (meraki?.positions) {
      positions = Array.isArray(meraki.positions) ? meraki.positions : [meraki.positions]
      positions = positions.map(p => {
        const map = { TOP: 'Top', JUNGLE: 'Jungle', MIDDLE: 'Mid', BOTTOM: 'Bot', SUPPORT: 'Support', MID: 'Mid', ADC: 'Bot' }
        return map[p.toUpperCase()] || p
      })
    }

    // Parse range type from Meraki or DD tags
    let rangeType = sup.rangeType || 'Melee'
    if (meraki?.attackType) {
      rangeType = meraki.attackType === 'RANGED' ? 'Ranged' : 'Melee'
    } else if (ddDetail.stats?.attackrange >= 400) {
      rangeType = 'Ranged'
    }

    // Parse resource from DD partype
    let resource = ddDetail.partype || 'Mana'
    if (resource === 'None' || resource === '') resource = 'Manaless'
    if (sup.resource) resource = sup.resource

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

    // Build skins
    const skins = (ddDetail.skins || [])
      .filter(s => s.num !== 0)
      .slice(0, 5)
      .map(s => ({
        id: `${id}_${s.num}`,
        name: s.name === 'default' ? `${ddDetail.name} ${s.num}` : s.name,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_${s.num}.jpg`
      }))

    champions.push({
      id,
      name: ddDetail.name,
      title: ddDetail.title,
      gender: sup.gender || 'Male',
      positions: positions.length > 0 ? positions : (ddDetail.tags || []),
      species: sup.species || ['Human'],
      resource,
      rangeType,
      regions: sup.regions || ['Runeterra'],
      releaseYear,
      icon: `${DDRAGON_BASE}/img/champion/${ddDetail.image.full}`,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`,
      abilities,
      skins,
      quote: sup.quote || '',
      emojiClue: sup.emojiClue || ''
    })
  }

  console.log(`\nProcessed ${champions.length} champions`)

  const outPath = join(__dirname, '..', 'src', 'data', 'champions.json')
  writeFileSync(outPath, JSON.stringify(champions, null, 2))
  console.log(`Written to ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
