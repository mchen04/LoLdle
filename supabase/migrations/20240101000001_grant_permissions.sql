-- Grant necessary permissions for Supabase roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select on public.champions to anon, authenticated;
grant select on public.abilities to anon, authenticated;
grant select on public.skins to anon, authenticated;
grant select, insert, update on public.game_stats to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
