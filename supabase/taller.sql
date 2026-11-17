-- MiTaller: parte del taller (mecánicos y avisos al cliente).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de schema.sql.

-- Cuentas del taller. Un usuario es mecánico si tiene fila aquí.
create table staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null
);

alter table staff enable row level security;

create policy "Cada mecánico ve su ficha" on staff
  for select to authenticated
  using (user_id = (select auth.uid()));

-- security definer: así las políticas de otras tablas pueden consultarla sin depender de su RLS.
create function is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- El taller ve y actualiza todos los coches y tareas.
create policy "El taller ve todos los coches" on vehicles
  for select to authenticated using ((select is_staff()));
create policy "El taller actualiza coches" on vehicles
  for update to authenticated using ((select is_staff())) with check ((select is_staff()));
create policy "El taller ve todas las tareas" on tasks
  for select to authenticated using ((select is_staff()));
create policy "El taller actualiza tareas" on tasks
  for update to authenticated using ((select is_staff())) with check ((select is_staff()));

-- Avisos que ve el cliente (el texto ya redactado y revisado por el mecánico).
create table vehicle_updates (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  author_name text not null,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index on vehicle_updates (vehicle_id, created_at);

-- Lo que dijo o escribió el mecánico antes de pasar por la IA. Solo lo ve el taller.
create table vehicle_update_sources (
  update_id uuid primary key references vehicle_updates (id) on delete cascade,
  source text not null check (source in ('audio', 'texto')),
  original text not null
);

alter table vehicle_updates enable row level security;
alter table vehicle_update_sources enable row level security;

create policy "El cliente ve los avisos de sus coches" on vehicle_updates
  for select to authenticated
  using (exists (
    select 1 from vehicles v
    where v.id = vehicle_updates.vehicle_id and v.owner_id = (select auth.uid())
  ));
create policy "El taller ve todos los avisos" on vehicle_updates
  for select to authenticated using ((select is_staff()));
create policy "El taller ve los originales" on vehicle_update_sources
  for select to authenticated using ((select is_staff()));

-- Publicar = guardar aviso + original de una vez. El autor sale de la sesión, no del cliente.
create function publish_update(p_vehicle_id uuid, p_message text, p_source text, p_original text)
returns vehicle_updates
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_update public.vehicle_updates;
begin
  select name into v_name from public.staff where user_id = auth.uid();
  if v_name is null then
    raise exception 'Solo el taller puede publicar avisos' using errcode = '42501';
  end if;

  insert into public.vehicle_updates (vehicle_id, author_id, author_name, message)
  values (p_vehicle_id, auth.uid(), v_name, trim(p_message))
  returning * into v_update;

  insert into public.vehicle_update_sources (update_id, source, original)
  values (v_update.id, p_source, p_original);

  return v_update;
end $$;

revoke execute on function publish_update from public, anon;
grant execute on function publish_update to authenticated;

alter publication supabase_realtime add table vehicle_updates;

-- Para dar de alta un mecánico (crea antes el usuario en Authentication → Users):
-- insert into staff (user_id, name)
-- select id, 'Manolo' from auth.users where email = 'mecanico@ejemplo.com';
