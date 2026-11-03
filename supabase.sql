-- Puntos online para Micro Michael y el Rey del Pop.
-- Pega este script entero en Supabase → SQL Editor → New query, y pulsa Run.
-- Se puede ejecutar más de una vez sin problema.
--
-- Cómo funciona:
--   · Cada jugador recibe un código secreto (por ejemplo MJ-7K3Q-9XPA).
--   · Con ese código guarda y recupera su progreso desde cualquier dispositivo.
--   · Nadie puede leer ni tocar la tabla directamente: todo pasa por las
--     funciones de abajo, que solo devuelven lo necesario.
--   · En la base de datos el código se guarda cifrado (hash), nunca en claro.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.mm_players (
  id          bigint generated always as identity primary key,
  code_hash   text unique not null,
  name        text not null check (char_length(name) between 1 and 16),
  total       integer not null default 0,
  medals      integer not null default 0,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Veces que el jugador se ha cambiado el nombre (máximo 2).
alter table public.mm_players add column if not exists renames integer not null default 0;

-- Seguridad: la tabla queda cerrada. Sin políticas, nadie la lee ni escribe
-- desde fuera; solo las funciones de este archivo pueden usarla.
alter table public.mm_players enable row level security;
revoke all on table public.mm_players from anon, authenticated;

create or replace function public.mm_hash(p_code text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(upper(trim(coalesce(p_code, ''))), 'sha256'), 'hex')
$$;

-- Crea un jugador nuevo y devuelve su código secreto.
create or replace function public.mm_create(p_name text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
  v_try   int := 0;
  i       int;
begin
  if p_name is null or char_length(trim(p_name)) < 1 or char_length(trim(p_name)) > 16 then
    raise exception 'Nombre no válido';
  end if;
  loop
    v_code := 'MJ-';
    for i in 1..8 loop
      v_code := v_code || substr(v_chars, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_chars)), 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    begin
      insert into public.mm_players (code_hash, name) values (public.mm_hash(v_code), trim(p_name));
      return json_build_object('code', v_code);
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 5 then raise; end if;
    end;
  end loop;
end
$$;

-- Guarda el progreso del jugador que tenga ese código.
-- El nombre solo se puede cambiar 2 veces; después se queda el último.
create or replace function public.mm_save(p_code text, p_name text, p_total integer, p_medals integer, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old text;
  v_ren integer;
  v_new text;
  v_change boolean;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 100000 then
    raise exception 'Datos no válidos';
  end if;
  select name, renames into v_old, v_ren from public.mm_players where code_hash = public.mm_hash(p_code);
  if not found then return false; end if;
  v_new := left(coalesce(nullif(trim(p_name), ''), v_old), 16);
  v_change := v_new <> v_old and v_ren < 2;
  update public.mm_players
     set name       = case when v_change then v_new else v_old end,
         renames    = renames + case when v_change then 1 else 0 end,
         total      = greatest(0, least(coalesce(p_total, 0), 10000000)),
         medals     = greatest(0, least(coalesce(p_medals, 0), 1000)),
         data       = p_data,
         updated_at = now()
   where code_hash = public.mm_hash(p_code);
  return true;
end
$$;

-- Recupera el progreso de un código (en otro móvil, por ejemplo).
create or replace function public.mm_load(p_code text)
returns json
language sql
stable
security definer
set search_path = public, extensions
as $$
  select json_build_object('name', name, 'renames', renames, 'data', data)
    from public.mm_players
   where code_hash = public.mm_hash(p_code)
$$;

-- Borra para siempre al jugador que tenga ese código.
create or replace function public.mm_delete(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.mm_players where code_hash = public.mm_hash(p_code);
  return found;
end
$$;

-- Cambia el código de un jugador por uno nuevo (el anterior deja de valer).
-- Hace falta el código actual, que el dispositivo del jugador tiene guardado.
create or replace function public.mm_regen(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
  v_try   int := 0;
  i       int;
begin
  if not exists (select 1 from public.mm_players where code_hash = public.mm_hash(p_code)) then
    return null;
  end if;
  loop
    v_code := 'MJ-';
    for i in 1..8 loop
      v_code := v_code || substr(v_chars, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_chars)), 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    begin
      update public.mm_players set code_hash = public.mm_hash(v_code), updated_at = now()
       where code_hash = public.mm_hash(p_code);
      return json_build_object('code', v_code);
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 5 then raise; end if;
    end;
  end loop;
end
$$;

-- Clasificación mundial: solo apodo, puntos y medallas.
create or replace function public.mm_top(p_limit integer default 20)
returns table (name text, total integer, medals integer)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select name, total, medals
    from public.mm_players
   where total > 0
   order by total desc, updated_at asc
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;

revoke all on function public.mm_create(text) from public;
revoke all on function public.mm_save(text, text, integer, integer, jsonb) from public;
revoke all on function public.mm_load(text) from public;
revoke all on function public.mm_top(integer) from public;
revoke all on function public.mm_delete(text) from public;
revoke all on function public.mm_regen(text) from public;
grant execute on function public.mm_create(text) to anon, authenticated;
grant execute on function public.mm_save(text, text, integer, integer, jsonb) to anon, authenticated;
grant execute on function public.mm_load(text) to anon, authenticated;
grant execute on function public.mm_top(integer) to anon, authenticated;
grant execute on function public.mm_delete(text) to anon, authenticated;
grant execute on function public.mm_regen(text) to anon, authenticated;
-- ===== Quién está jugando ahora (solo lo ve el dueño, desde el panel de Supabase) =====
-- Cada pestaña del juego abierta avisa cada 30 segundos de que sigue jugando
-- y de en qué juego está. Los avisos de más de un día se borran solos.
create table if not exists public.mm_presence (
  session     text primary key check (char_length(session) between 8 and 40),
  name        text,
  game        text,
  has_code    boolean not null default false,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
alter table public.mm_presence enable row level security;
revoke all on table public.mm_presence from anon, authenticated;

create or replace function public.mm_ping(p_session text, p_name text, p_game text, p_code boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_session is null or char_length(p_session) not between 8 and 40 then return; end if;
  insert into public.mm_presence (session, name, game, has_code)
  values (p_session, left(p_name, 16), left(p_game, 30), coalesce(p_code, false))
  on conflict (session) do update
     set name = excluded.name, game = excluded.game, has_code = excluded.has_code, last_seen = now();
  delete from public.mm_presence where last_seen < now() - interval '1 day';
end
$$;
revoke all on function public.mm_ping(text, text, text, boolean) from public;
grant execute on function public.mm_ping(text, text, text, boolean) to anon, authenticated;

-- Vista para ti: quién ha dado señales en los últimos 2 minutos.
-- Ábrela en Supabase → Table Editor → jugando_ahora.
create or replace view public.jugando_ahora as
  select coalesce(name, '(sin nombre)') as jugador,
         game                            as juego,
         has_code                        as tiene_codigo,
         first_seen                      as conectado_desde,
         last_seen                       as ultima_senal
    from public.mm_presence
   where last_seen > now() - interval '2 minutes'
   order by last_seen desc;
revoke all on public.jugando_ahora from anon, authenticated;
