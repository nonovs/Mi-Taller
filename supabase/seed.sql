-- Datos de prueba.
-- 1. Crea un usuario en Supabase → Authentication → Users → Add user (email + contraseña).
-- 2. Cambia el email de abajo por el de ese usuario y ejecuta este archivo en el SQL Editor.

with cliente as (
  select id from auth.users where email = 'cliente@ejemplo.com'
),
coche as (
  insert into vehicles (owner_id, plate, brand, model, year, color, mileage, status, estimated_delivery, notes)
  select id, '1234 KLM', 'Seat', 'León', 2019, '#C0392B', 87450, 'en_reparacion',
         now() + interval '2 days', 'Ruido al frenar y revisión de los 90.000 km.'
  from cliente
  returning id
)
insert into tasks (vehicle_id, title, description, status, position)
select coche.id, t.title, t.description, t.status::task_status, t.position
from coche, (values
  ('Diagnóstico inicial', 'Prueba en carretera y lectura de errores con la máquina.', 'completada', 1),
  ('Cambio de aceite y filtros', 'Aceite 5W30, filtro de aceite, aire y habitáculo.', 'completada', 2),
  ('Sustitución de pastillas delanteras', 'Las pastillas estaban al 10 %. Discos en buen estado.', 'en_curso', 3),
  ('Revisión de suspensión', null, 'pendiente', 4),
  ('Lavado y entrega', null, 'pendiente', 5)
) as t(title, description, status, position);
