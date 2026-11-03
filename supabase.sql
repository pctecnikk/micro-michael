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
create or replace function public.mm_save(p_code text, p_name text, p_total integer, p_medals integer, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 100000 then
    raise exception 'Datos no válidos';
  end if;
  update public.mm_players
     set name       = left(coalesce(nullif(trim(p_name), ''), name), 16),
         total      = greatest(0, least(coalesce(p_total, 0), 10000000)),
         medals     = greatest(0, least(coalesce(p_medals, 0), 1000)),
         data       = p_data,
         updated_at = now()
   where code_hash = public.mm_hash(p_code);
  return found;
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
  select json_build_object('name', name, 'data', data)
    from public.mm_players
   where code_hash = public.mm_hash(p_code)
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
grant execute on function public.mm_create(text) to anon, authenticated;
grant execute on function public.mm_save(text, text, integer, integer, jsonb) to anon, authenticated;
grant execute on function public.mm_load(text) to anon, authenticated;
grant execute on function public.mm_top(integer) to anon, authenticated;
