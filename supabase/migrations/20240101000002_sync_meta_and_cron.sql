-- Metadata table to track sync state (e.g. Data Dragon version)
create table if not exists public.sync_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.sync_meta enable row level security;

create policy "sync_meta is publicly readable"
  on public.sync_meta for select
  using (true);

-- Schedule daily sync via pg_cron + pg_net
-- Calls the sync-champions Edge Function every day at 06:00 UTC
-- (Riot patches typically go live Tuesday/Wednesday, this catches updates promptly)
--
-- To enable: ensure pg_cron and pg_net extensions are enabled in your Supabase project
-- (Dashboard > Database > Extensions)
--
-- Uncomment the lines below after enabling the extensions and deploying the Edge Function:

-- select cron.schedule(
--   'sync-champions-daily',
--   '0 6 * * *',
--   $$
--   select net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-champions',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
