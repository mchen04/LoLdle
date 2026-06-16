create index if not exists idx_abilities_champion_slot_order
  on public.abilities (
    champion_id,
    (case slot when 'P' then 0 when 'Q' then 1 when 'W' then 2 when 'E' then 3 when 'R' then 4 else 5 end)
  )
  include (name, icon_url, slot);

create index if not exists idx_skins_champion_id_cover
  on public.skins(champion_id, id)
  include (name, splash_url);

drop index if exists public.idx_abilities_champion;
drop index if exists public.idx_skins_champion;
