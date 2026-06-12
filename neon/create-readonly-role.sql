-- Run as neondb_owner. Creates the read-only role used by the frontend
-- (VITE_NEON_DATABASE_URL). Replace the password before running.
create role loldle_read login password 'CHANGE_ME';
grant usage on schema public to loldle_read;
grant select on all tables in schema public to loldle_read;
alter default privileges in schema public grant select on tables to loldle_read;
-- game_stats is the only table the client may write (per-device anonymous stats)
grant insert, update on public.game_stats to loldle_read;
grant usage on all sequences in schema public to loldle_read;
