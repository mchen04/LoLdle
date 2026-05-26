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
  detectGender, generateEmoji,
  type UniverseChampion,
} from "../_shared/champion-maps.ts";

const MERAKI_BASE =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions";
const UNIVERSE_BASE =
  "https://universe-meeps.leagueoflegends.com/v1/en_us/champions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} → ${res.status}`);
  return res.json();
}

async function fetchOptional(url: string) {
  try {
    return await fetchJSON(url);
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
    const data = await fetchOptional(`${UNIVERSE_BASE}/${slug}/index.json`);
    if (data?.champion) return data.champion;
  }
  return null;
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
    const versions = await fetchJSON(
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
    const ddChampions = await fetchJSON(
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

    for (const id of championIds) {
      // deno-lint-ignore no-explicit-any -- external Riot API response
      let ddDetail: Record<string, any>;
      try {
        const ddDetailRes = await fetchJSON(
          `${ddBase}/data/en_US/champion/${id}.json`
        );
        ddDetail = ddDetailRes.data[id];
      } catch {
        continue;
      }

      // deno-lint-ignore no-explicit-any -- external Meraki API response
      const meraki: Record<string, any> | null = await fetchOptional(`${MERAKI_BASE}/${id}.json`);

      const sup: Record<string, unknown> =
        (supplement[id] as Record<string, unknown>) ??
        (supplement[ddDetail.name] as Record<string, unknown>) ??
        {};
      const hasSupplement =
        !!supplement[id] || !!supplement[ddDetail.name];

      if (!existingIds.has(id)) {
        newChampions.push(ddDetail.name);
      }

      let universe: UniverseChampion | null = null;
      if (!hasSupplement) {
        universe = await fetchUniverseData(id, ddDetail.name);
        autoPopulated.push(ddDetail.name);
      }

      // --- Resolve fields (same priority as fetch-champions.mjs) ---

      let gender = sup.gender as string;
      if (!gender) {
        gender = detectGender(ddDetail.lore || ddDetail.blurb || "");
      }

      let species = sup.species as string[];
      if (!species || species.length === 0) {
        if (universe?.races?.length) {
          species = universe.races.map(
            (r: { name: string }) => r.name
          );
        } else {
          species = ["Human"];
        }
      }

      let regions = sup.regions as string[];
      if (!regions || regions.length === 0) {
        if (universe) {
          const slug = universe["associated-faction-slug"] as string;
          regions = [FACTION_MAP[slug] || "Runeterra"];
        } else {
          regions = ["Runeterra"];
        }
      }

      let quote = sup.quote as string;
      if (!quote) {
        quote = universe?.biography?.quote || "";
      }

      let emojiClue = sup.emojiClue as string;
      if (!emojiClue) {
        const ddRoles = ddDetail.tags || [];
        emojiClue = generateEmoji(ddRoles, species, regions[0]);
      }

      let releaseYear = (sup.releaseYear as number) || 2009;
      if (meraki?.releaseDate) {
        releaseYear = new Date(
          meraki.releaseDate as string
        ).getFullYear();
      }

      let positions = (sup.positions as string[]) || [];
      if (meraki?.positions) {
        const mp = Array.isArray(meraki.positions)
          ? meraki.positions
          : [meraki.positions];
        const posMap: Record<string, string> = {
          TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid",
          BOTTOM: "Bot", SUPPORT: "Support", MID: "Mid", ADC: "Bot",
        };
        positions = mp.map(
          (p: string) => posMap[p.toUpperCase()] || p
        );
      }

      let rangeType = (sup.rangeType as string) || "Melee";
      if (meraki?.attackType) {
        rangeType =
          meraki.attackType === "RANGED" ? "Ranged" : "Melee";
      } else if (ddDetail.stats?.attackrange >= 400) {
        rangeType = "Ranged";
      }

      let resource = ddDetail.partype || "Mana";
      if (resource === "None" || resource === "") resource = "Manaless";
      if (sup.resource) resource = sup.resource as string;

      championRows.push({
        id,
        name: ddDetail.name,
        title: ddDetail.title,
        gender,
        positions:
          positions.length > 0 ? positions : ddDetail.tags || [],
        species,
        resource,
        range_type: rangeType,
        regions,
        release_year: releaseYear,
        icon_url: `${ddBase}/img/champion/${ddDetail.image.full}`,
        splash_url: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`,
        quote,
        emoji_clue: emojiClue,
      });

      if (ddDetail.passive) {
        abilityRows.push({
          champion_id: id,
          name: ddDetail.passive.name,
          icon_url: `${ddBase}/img/passive/${ddDetail.passive.image.full}`,
          slot: "P",
        });
      }
      const slots = ["Q", "W", "E", "R"];
      for (let i = 0; i < (ddDetail.spells?.length ?? 0); i++) {
        const spell = ddDetail.spells[i];
        abilityRows.push({
          champion_id: id,
          name: spell.name,
          icon_url: `${ddBase}/img/spell/${spell.image.full}`,
          slot: slots[i],
        });
      }

      for (const s of ddDetail.skins ?? []) {
        if (s.num === 0) continue;
        skinRows.push({
          id: `${id}_${s.num}`,
          champion_id: id,
          name:
            s.name === "default"
              ? `${ddDetail.name} ${s.num}`
              : s.name,
          splash_url: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_${s.num}.jpg`,
        });
      }
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

    for (let i = 0; i < skinRows.length; i += BATCH) {
      const { error } = await supabase
        .from("skins")
        .upsert(skinRows.slice(i, i + BATCH));
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
