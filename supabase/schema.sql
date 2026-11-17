-- MiTaller: esquema de base de datos.
-- Pegar entero en Supabase → SQL Editor → Run.

-- Estados por los que pasa un coche en el taller (en orden).
create type vehicle_status as enum ('recibido', 'diagnostico', 'en_reparacion', 'listo', 'entregado');

-- Estados de cada tarea.
create type task_status as enum ('pendiente', 'en_curso', 'completada');

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  plate text not null,
  brand text not null,
  model text not null,
  year int,
  color text not null default '#9AA0A6', -- color de la carrocería en hex, para el dibujo
  mileage int,
  status vehicle_status not null default 'recibido',
  entered_at timestamptz not null default now(),
  estimated_delivery timestamptz,
  notes text
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'pendiente',
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create index on vehicles (owner_id);
create index on tasks (vehicle_id, position);

-- Mantener updated_at al día cuando el taller cambia una tarea.
create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger tasks_touch before update on tasks
  for each row execute function touch_updated_at();

-- Seguridad: un cliente solo puede LEER sus propios coches y sus tareas.
-- El taller escribe desde el panel de Supabase (o con la service key), que se salta RLS.
alter table vehicles enable row level security;
alter table tasks enable row level security;

create policy "El cliente ve sus coches" on vehicles
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "El cliente ve las tareas de sus coches" on tasks
  for select to authenticated
  using (exists (
    select 1 from vehicles v
    where v.id = tasks.vehicle_id and v.owner_id = (select auth.uid())
  ));

-- Avisar a la app en tiempo real cuando cambie un coche o una tarea.
alter publication supabase_realtime add table vehicles, tasks;
