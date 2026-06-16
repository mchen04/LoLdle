import type { neon as createNeonClient } from '@neondatabase/serverless'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DbProvider = 'neon' | 'supabase'

export const dbProvider: DbProvider =
  (import.meta.env.VITE_DB_PROVIDER as DbProvider) === 'supabase' ? 'supabase' : 'neon'

export interface DbChampionRow {
  id: string
  name: string
  title: string
  gender: string
  positions: string[]
  species: string[]
  resource: string
  range_type: string
  regions: string[]
  release_year: number
  icon_url: string
  splash_url: string
  quote: string
  emoji_clue: string
  abilities: { name: string; icon_url: string; slot: string }[]
  skins: { id: string; name: string; splash_url: string }[]
}

const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

type NeonSql = ReturnType<typeof createNeonClient>

let neonSql: NeonSql | null = null
let supabaseClient: SupabaseClient | null | undefined

async function getNeonSql(): Promise<NeonSql | null> {
  if (!neonUrl) return null
  if (neonSql) return neonSql

  const { neon, neonConfig } = await import('@neondatabase/serverless')
  neonConfig.disableWarningInBrowsers = true
  neonSql = neon(neonUrl)
  return neonSql
}

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseClient !== undefined) return supabaseClient
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseClient = null
    return supabaseClient
  }

  const { createClient } = await import('@supabase/supabase-js')
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

async function fetchChampionsNeon(): Promise<DbChampionRow[]> {
  const sql = await getNeonSql()
  if (!sql) {
    console.warn('VITE_NEON_DATABASE_URL not configured, no champion data available')
    return []
  }
  const rows = await sql`
    select
      c.id, c.name, c.title, c.gender, c.positions, c.species,
      c.resource, c.range_type, c.regions, c.release_year,
      c.icon_url, c.splash_url, c.quote, c.emoji_clue,
      coalesce(a.abilities, '[]'::json) as abilities,
      coalesce(s.skins, '[]'::json) as skins
    from public.champions c
    left join (
      select champion_id,
        json_agg(
          json_build_object('name', name, 'icon_url', icon_url, 'slot', slot)
          order by case slot when 'P' then 0 when 'Q' then 1 when 'W' then 2 when 'E' then 3 when 'R' then 4 else 5 end
        ) as abilities
      from public.abilities
      group by champion_id
    ) a on a.champion_id = c.id
    left join (
      select champion_id,
        json_agg(json_build_object('id', id, 'name', name, 'splash_url', splash_url) order by id) as skins
      from public.skins
      group by champion_id
    ) s on s.champion_id = c.id
    order by c.name
  `
  return rows as DbChampionRow[]
}

async function fetchChampionsSupabase(): Promise<DbChampionRow[]> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    console.warn('Supabase not configured, no champion data available')
    return []
  }
  const { data, error } = await supabase
    .from('champions')
    .select(`
      id, name, title, gender, positions, species, resource, range_type,
      regions, release_year, icon_url, splash_url, quote, emoji_clue,
      abilities(name, icon_url, slot),
      skins(id, name, splash_url)
    `)
    .order('name')
  if (error) {
    console.warn('Failed to load champions from Supabase:', error.message)
    return []
  }
  return data as DbChampionRow[]
}

export async function fetchChampions(): Promise<DbChampionRow[]> {
  return dbProvider === 'supabase' ? fetchChampionsSupabase() : fetchChampionsNeon()
}
