-- MiTaller v2: alta de coches por el taller, fichas de cliente y gestión de tareas.
-- Ejecutar DESPUÉS de schema.sql y taller.sql.

-- Ficha del cliente (la cuenta de acceso vive en auth.users).
create table clients (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;

create policy "El cliente ve su ficha" on clients
  for select to authenticated using (user_id = (select auth.uid()));
create policy "El taller ve todas las fichas" on clients
  for select to authenticated using ((select is_staff()));

-- Cuándo cambió el coche de estado por última vez (para mostrar "Listo desde las 12:30").
alter table vehicles add column status_changed_at timestamptz not null default now();

create function touch_status_changed_at() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;
  return new;
end $$;

create trigger vehicles_status_changed before update on vehicles
  for each row execute function touch_status_changed_at();

-- El taller crea coches y gestiona las tareas.
create policy "El taller crea coches" on vehicles
  for insert to authenticated with check ((select is_staff()));
create policy "El taller crea tareas" on tasks
  for insert to authenticated with check ((select is_staff()));
create policy "El taller borra tareas" on tasks
  for delete to authenticated using ((select is_staff()));

-- Reordenar: recibe los ids de las tareas en el orden nuevo.
create function reorder_tasks(p_vehicle_id uuid, p_task_ids uuid[])
returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_staff() then
    raise exception 'Solo el taller puede ordenar tareas' using errcode = '42501';
  end if;

  update public.tasks t
  set position = ordered.position
  from unnest(p_task_ids) with ordinality as ordered(id, position)
  where t.id = ordered.id and t.vehicle_id = p_vehicle_id;
end $$;

revoke execute on function reorder_tasks from public, anon;
grant execute on function reorder_tasks to authenticated;

alter publication supabase_realtime add table clients;
