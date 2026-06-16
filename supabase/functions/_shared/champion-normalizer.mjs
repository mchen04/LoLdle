const POSITION_MAP = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  SUPPORT: 'Support',
  MID: 'Mid',
  ADC: 'Bot',
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    for (;;) {
      const currentIndex = nextIndex++
      if (currentIndex >= items.length) return
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}

function asString(value) {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
}

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizePositions(value) {
  return asStringArray(Array.isArray(value) ? value : value ? [value] : [])
    .map(position => POSITION_MAP[position.toUpperCase()] || position)
}

export function detectGender(loreText) {
  if (!loreText) return 'Male'
  const lower = loreText.toLowerCase()
  const she = (lower.match(/\b(she|her|hers|herself)\b/g) || []).length
  const he = (lower.match(/\b(he|him|his|himself)\b/g) || []).length
  const they = (lower.match(/\b(they|them|their|themself)\b/g) || []).length
  if (they > she && they > he) return 'Non-binary'
  if (she > he) return 'Female'
  return 'Male'
}

export function createEmojiGenerator({ roleEmoji, raceEmoji, regionEmoji }) {
  return (roles, species, region) => {
    const parts = []
    const roleHit = roles.map(role => roleEmoji[role]).filter(Boolean)
    if (roleHit.length) parts.push(roleHit[0])
    const speciesHit = species.map(item => raceEmoji[item]).filter(Boolean)
    if (speciesHit.length) parts.push(speciesHit[0])
    const regionHit = regionEmoji[region]
    if (regionHit) parts.push(regionHit)
    if (parts.length < 3) parts.push('❓')
    return parts.slice(0, 4).join('')
  }
}

export function resolveChampionData({
  id,
  ddDetail,
  meraki,
  supplement,
  universe,
  ddBase,
  factionMap,
  generateEmoji,
}) {
  const source = supplement ?? {}
  const ddRoles = asStringArray(ddDetail.tags)

  const gender = asString(source.gender) || detectGender(ddDetail.lore || ddDetail.blurb || '')

  let species = asStringArray(source.species)
  if (species.length === 0) {
    species = universe?.races?.length
      ? universe.races.map(race => race.name).filter(Boolean)
      : ['Human']
  }

  let regions = asStringArray(source.regions)
  if (regions.length === 0) {
    const slug = universe?.['associated-faction-slug']
    regions = [slug ? (factionMap[slug] || 'Runeterra') : 'Runeterra']
  }

  const quote = asString(source.quote) || universe?.biography?.quote || ''
  const emojiClue = asString(source.emojiClue) || generateEmoji(ddRoles, species, regions[0])

  let releaseYear = asNumber(source.releaseYear) ?? 2009
  if (meraki?.releaseDate) {
    releaseYear = new Date(meraki.releaseDate).getFullYear()
  }

  let positions = normalizePositions(source.positions)
  if (meraki?.positions) {
    positions = normalizePositions(meraki.positions)
  }

  let rangeType = asString(source.rangeType) || 'Melee'
  if (meraki?.attackType) {
    rangeType = meraki.attackType === 'RANGED' ? 'Ranged' : 'Melee'
  } else if (ddDetail.stats?.attackrange >= 400) {
    rangeType = 'Ranged'
  }

  let resource = ddDetail.partype || 'Mana'
  if (resource === 'None' || resource === '') resource = 'Manaless'
  const supplementResource = asString(source.resource)
  if (supplementResource) resource = supplementResource

  const abilities = []
  if (ddDetail.passive) {
    abilities.push({
      name: ddDetail.passive.name,
      icon: `${ddBase}/img/passive/${ddDetail.passive.image.full}`,
      slot: 'P',
    })
  }

  const slots = ['Q', 'W', 'E', 'R']
  for (let i = 0; i < (ddDetail.spells?.length ?? 0); i++) {
    const spell = ddDetail.spells[i]
    abilities.push({
      name: spell.name,
      icon: `${ddBase}/img/spell/${spell.image.full}`,
      slot: slots[i],
    })
  }

  const skinCandidates = (ddDetail.skins ?? [])
    .filter(skin => skin.num !== 0)
    .map(skin => ({
      id: `${id}_${skin.num}`,
      name: skin.name === 'default' ? `${ddDetail.name} ${skin.num}` : skin.name,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_${skin.num}.jpg`,
    }))

  return {
    champion: {
      id,
      name: ddDetail.name,
      title: ddDetail.title,
      gender,
      positions: positions.length > 0 ? positions : ddRoles,
      species,
      resource,
      rangeType,
      regions,
      releaseYear,
      icon: `${ddBase}/img/champion/${ddDetail.image.full}`,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`,
      abilities,
      skins: [],
      quote,
      emojiClue,
    },
    skinCandidates,
  }
}
