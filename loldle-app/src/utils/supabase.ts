import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function fetchChampionsFromSupabase() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('champions')
    .select('*')
    .order('name')
  if (error) {
    console.warn('Supabase fetch failed, using local data:', error.message)
    return null
  }
  return data
}

export async function syncStats(deviceId: string, mode: string, stats: Record<string, unknown>) {
  if (!supabase) return
  await supabase.from('game_stats').upsert({
    device_id: deviceId,
    mode,
    ...stats,
  }, { onConflict: 'device_id,mode' })
}
