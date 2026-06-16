// Supabase Edge Function: sync-champions
// Fetches latest champion data from Data Dragon + Meraki + Universe API,
// auto-populates all fields, and upserts into Supabase.
//
// Data source contract (same as fetch-champions.mjs):
//   Data Dragon  → name, title, icon, splash, abilities, skins, resource (partype), lore
//   Meraki       → positions, release year, range type (attackType)
//   Universe API → quote (biography.quote), region (faction slug), species (races)
//   Supplement   → overrides all of the above when present (curated quality)
//   Heuristics   → gender (pronoun detection from lore), emoji (tag-based generation)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FACTION_MAP,
  generateEmoji,
  type UniverseChampion,
} from "../_shared/champion-maps.ts";
// @deno-types="../_shared/champion-normalizer.d.ts"
import {
  mapWithConcurrency,
  resolveChampionData,
} from "../_shared/champion-normalizer.mjs";

const MERAKI_BASE =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions";
const UNIVERSE_BASE =
  "https://universe-meeps.leagueoflegends.com/v1/en_us/champions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DDragonImage {
  full: string;
}

interface DDragonSpell {
  name: string;
  image: DDragonImage;
}

interface DDragonSkin {
  num: number;
  name: string;
}

interface DDragonDetail {
  name: string;
  title: string;
  lore?: string;
  blurb?: string;
  tags?: string[];
  partype?: string;
  image: DDragonImage;
  passive?: { name: string; image: DDragonImage };
  spells?: DDragonSpell[];
  skins?: DDragonSkin[];
  stats?: { attackrange?: number };
}

interface MerakiChampion {
  releaseDate?: string;
  positions?: string | string[];
  attackType?: string;
}

async function fetchJSON<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} → ${res.status}`);
  return res.json();
}

async function fetchOptional<T = unknown>(url: string): Promise<T | null> {
  try {
    return await fetchJSON<T>(url);
  } catch {
    return null;
  }
}

async function fetchUniverseData(ddId: string, name: string): Promise<UniverseChampion | null> {
  const slugs = [
    ddId.toLowerCase(),
    name.toLowerCase().replace(/[^a-z]/g, ""),
  ];
  for (const slug of [...new Set(slugs)]) {
    const data = await fetchOptional<{ champion?: UniverseChampion }>(`${UNIVERSE_BASE}/${slug}/index.json`);
    if (data?.champion) return data.champion;
  }
  return null;
}

interface ResolvedChampionRows {
  championRow: Record<string, unknown>;
  abilityRows: Record<string, unknown>[];
  skinRows: Record<string, unknown>[];
  newChampion: string | null;
  autoPopulated: string | null;
}

async function resolveChampionRows(
  id: string,
  context: {
    ddBase: string;
    supplement: Record<string, Record<string, unknown>>;
    existingIds: Set<string>;
  },
): Promise<ResolvedChampionRows | null> {
  let ddDetail: DDragonDetail;
  try {
    const ddDetailRes = await fetchJSON<{ data: Record<string, DDragonDetail> }>(
      `${context.ddBase}/data/en_US/champion/${id}.json`
    );
    ddDetail = ddDetailRes.data[id];
  } catch {
    return null;
  }

  const sup: Record<string, unknown> =
    (context.supplement[id] as Record<string, unknown>) ??
    (context.supplement[ddDetail.name] as Record<string, unknown>) ??
    {};
  const hasSupplement =
    !!context.supplement[id] || !!context.supplement[ddDetail.name];

  const [meraki, universe] = await Promise.all([
    fetchOptional<MerakiChampion>(`${MERAKI_BASE}/${id}.json`),
    hasSupplement
      ? Promise.resolve(null)
      : fetchUniverseData(id, ddDetail.name),
  ]);

  const { champion, skinCandidates } = resolveChampionData({
    id,
    ddDetail,
    meraki,
    supplement: sup,
    universe,
    ddBase: context.ddBase,
    factionMap: FACTION_MAP,
    generateEmoji,
  });

  const skinChecks = await Promise.all(skinCandidates.map(async (skin) => {
    try {
      const res = await fetch(skin.splash, { method: "HEAD" });
      if (!res.ok) return null;
      return {
        id: skin.id,
        champion_id: id,
        name: skin.name,
        splash_url: skin.splash,
      };
    } catch { return null; }
  }));
  const validSkinRows: Record<string, unknown>[] = [];
  for (const skin of skinChecks) {
    if (skin) validSkinRows.push(skin);
  }

  return {
    championRow: {
      id: champion.id,
      name: champion.name,
      title: champion.title,
      gender: champion.gender,
      positions: champion.positions,
      species: champion.species,
      resource: champion.resource,
      range_type: champion.rangeType,
      regions: champion.regions,
      release_year: champion.releaseYear,
      icon_url: champion.icon,
      splash_url: champion.splash,
      quote: champion.quote,
      emoji_clue: champion.emojiClue,
    },
    abilityRows: champion.abilities.map((ability) => ({
      champion_id: id,
      name: ability.name,
      icon_url: ability.icon,
      slot: ability.slot,
    })),
    skinRows: validSkinRows,
    newChampion: context.existingIds.has(id) ? null : ddDetail.name,
    autoPopulated: hasSupplement ? null : ddDetail.name,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get latest DD version
    const versions = await fetchJSON<string[]>(
      "https://ddragon.leagueoflegends.com/api/versions.json"
    );
    const ddVersion: string = versions[0];
    const ddBase = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}`;

    // 2. Check if we already synced this version
    const { data: meta } = await supabase
      .from("sync_meta")
      .select("value")
      .eq("key", "dd_version")
      .single();

    const previousVersion = meta?.value ?? null;
    const force = new URL(req.url).searchParams.get("force") === "true";

    if (previousVersion === ddVersion && !force) {
      return new Response(
        JSON.stringify({
          ddVersion,
          previousVersion,
          skipped: true,
          message: "Already up to date",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch champion list
    const ddChampions = await fetchJSON<{ data: Record<string, unknown> }>(
      `${ddBase}/data/en_US/champion.json`
    );
    const championIds = Object.keys(ddChampions.data);

    // 4. Load existing champion IDs to detect new ones
    const { data: existingChamps } = await supabase
      .from("champions")
      .select("id");
    const existingIds = new Set(
      (existingChamps ?? []).map((c: { id: string }) => c.id)
    );

    // 5. Load supplement from storage
    let supplement: Record<string, Record<string, unknown>> = {};
    try {
      const { data: supData } = await supabase.storage
        .from("game-data")
        .download("champion-supplement.json");
      if (supData) {
        supplement = JSON.parse(await supData.text());
      }
    } catch {
      // No supplement in storage — will auto-populate everything
    }

    const championRows: Record<string, unknown>[] = [];
    const abilityRows: Record<string, unknown>[] = [];
    const skinRows: Record<string, unknown>[] = [];
    const newChampions: string[] = [];
    const autoPopulated: string[] = [];

    const resolvedRows = await mapWithConcurrency(
      championIds,
      6,
      (id) => resolveChampionRows(id, { ddBase, supplement, existingIds }),
    );

    for (const resolved of resolvedRows) {
      if (!resolved) continue;
      championRows.push(resolved.championRow);
      abilityRows.push(...resolved.abilityRows);
      skinRows.push(...resolved.skinRows);
      if (resolved.newChampion) newChampions.push(resolved.newChampion);
      if (resolved.autoPopulated) autoPopulated.push(resolved.autoPopulated);
    }

    // 6. Upsert in batches
    const BATCH = 50;

    for (let i = 0; i < championRows.length; i += BATCH) {
      const { error } = await supabase
        .from("champions")
        .upsert(championRows.slice(i, i + BATCH));
      if (error) throw error;
    }

    await supabase.from("abilities").delete().gt("id", 0);
    for (let i = 0; i < abilityRows.length; i += BATCH) {
      const { error } = await supabase
        .from("abilities")
        .insert(abilityRows.slice(i, i + BATCH));
      if (error) throw error;
    }

    await supabase.from("skins").delete().neq("id", "");
    for (let i = 0; i < skinRows.length; i += BATCH) {
      const { error } = await supabase
        .from("skins")
        .insert(skinRows.slice(i, i + BATCH));
      if (error) throw error;
    }

    // 7. Update sync_meta
    await supabase.from("sync_meta").upsert({
      key: "dd_version",
      value: ddVersion,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ddVersion,
        previousVersion,
        championsProcessed: championRows.length,
        abilitiesProcessed: abilityRows.length,
        skinsProcessed: skinRows.length,
        newChampions,
        autoPopulated,
        skipped: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
