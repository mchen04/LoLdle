// Database provider abstraction. Set VITE_DB_PROVIDER to 'neon' or 'supabase'
// to choose where champion data is loaded from. Defaults to 'neon'.
import { neon, neonConfig } from '@neondatabase/serverless'
import { supabase } from './supabase'

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

// Browser use is intentional: this is a read-only role limited to public game
// data (equivalent to Supabase's anon key + RLS read policies).
neonConfig.disableWarningInBrowsers = true

const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL

async function fetchChampionsNeon(): Promise<DbChampionRow[]> {
  if (!neonUrl) {
    console.warn('VITE_NEON_DATABASE_URL not configured, no champion data available')
    return []
  }
  const sql = neon(neonUrl)
  const rows = await sql`
    select c.*,
      coalesce((
        select json_agg(json_build_object('name', a.name, 'icon_url', a.icon_url, 'slot', a.slot))
        from public.abilities a where a.champion_id = c.id
      ), '[]'::json) as abilities,
      coalesce((
        select json_agg(json_build_object('id', s.id, 'name', s.name, 'splash_url', s.splash_url))
        from public.skins s where s.champion_id = c.id
      ), '[]'::json) as skins
    from public.champions c
  `
  return rows as DbChampionRow[]
}

async function fetchChampionsSupabase(): Promise<DbChampionRow[]> {
  if (!supabase) {
    console.warn('Supabase not configured, no champion data available')
    return []
  }
  const { data, error } = await supabase
    .from('champions')
    .select('*, abilities(*), skins(*)')
  if (error) {
    console.warn('Failed to load champions from Supabase:', error.message)
    return []
  }
  return data as DbChampionRow[]
}

export async function fetchChampions(): Promise<DbChampionRow[]> {
  return dbProvider === 'supabase' ? fetchChampionsSupabase() : fetchChampionsNeon()
}
