// Edge Function: el taller da de alta un coche.
// Si el cliente no tiene cuenta, se crea con una contraseña temporal que el mecánico le envía
// (p. ej. por WhatsApp). Al entrar por primera vez, la app obliga a cambiarla.

import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { findUserIdByEmail, isStaff, json, temporaryPassword } from '../_shared/accounts.ts';

type Body = {
  client: { email: string; full_name: string; phone?: string | null };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year?: number | null;
    color: string;
    mileage?: number | null;
    notes?: string | null;
    estimated_delivery?: string | null;
  };
  tasks: string[];
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    if (!(await isStaff(ctx.supabase))) {
      return json({ error: 'Solo el personal del taller puede dar de alta coches.' }, 403);
    }

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Datos no válidos.' }, 400);
    }

    const email = body.client?.email?.trim().toLowerCase() ?? '';
    const fullName = body.client?.full_name?.trim() ?? '';
    const plate = formatPlate(body.vehicle?.plate ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'El email del cliente no es válido.' }, 400);
    if (!fullName) return json({ error: 'Falta el nombre del cliente.' }, 400);
    if (!plate) return json({ error: 'Falta la matrícula.' }, 400);
    if (!body.vehicle.brand?.trim() || !body.vehicle.model?.trim()) {
      return json({ error: 'Falta la marca o el modelo.' }, 400);
    }

    const admin = ctx.supabaseAdmin;

    // 1. Buscar o crear al cliente.
    let userId: string;
    let password: string | null = null;
    const { data: existing } = await admin
      .from('clients')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      userId = existing.user_id;
    } else {
      password = temporaryPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, must_change_password: true },
      });
      if (created?.user) {
        userId = created.user.id;
      } else if (createError?.code === 'email_exists') {
        // Ya tenía cuenta (creada a mano) pero no ficha de cliente: se respeta su contraseña.
        const found = await findUserIdByEmail(admin, email);
        if (!found) return json({ error: 'No se pudo encontrar la cuenta de ese email.' }, 500);
        userId = found;
        password = null;
      } else {
        console.error(createError);
        return json({ error: `No se pudo crear la cuenta: ${createError?.message ?? 'error desconocido'}` }, 502);
      }

      const { error: clientError } = await admin.from('clients').upsert({
        user_id: userId,
        full_name: fullName,
        email,
        phone: body.client.phone?.trim() || null,
      });
      if (clientError) return json({ error: clientError.message }, 500);
    }

    // 2. Crear el coche y sus tareas.
    const { data: vehicle, error: vehicleError } = await admin
      .from('vehicles')
      .insert({
        owner_id: userId,
        plate,
        brand: body.vehicle.brand.trim(),
        model: body.vehicle.model.trim(),
        year: body.vehicle.year ?? null,
        color: body.vehicle.color || '#9AA0A6',
        mileage: body.vehicle.mileage ?? null,
        notes: body.vehicle.notes?.trim() || null,
        estimated_delivery: body.vehicle.estimated_delivery ?? null,
      })
      .select('id')
      .single();
    if (vehicleError) return json({ error: vehicleError.message }, 500);

    const titles = (body.tasks ?? []).map((title) => title.trim()).filter(Boolean);
    if (titles.length) {
      const { error: tasksError } = await admin
        .from('tasks')
        .insert(titles.map((title, index) => ({ vehicle_id: vehicle.id, title, position: index + 1 })));
      if (tasksError) return json({ error: tasksError.message }, 500);
    }

    // password solo viene si la cuenta es nueva: el mecánico se la pasa al cliente.
    return json({ vehicle_id: vehicle.id, client_email: email, temporary_password: password });
  }),
};

/** "1234klm" → "1234 KLM". Otros formatos se dejan en mayúsculas tal cual. */
function formatPlate(raw: string) {
  const compact = raw.replace(/[\s-]/g, '').toUpperCase();
  const match = compact.match(/^(\d{4})([A-Z]{3})$/);
  return match ? `${match[1]} ${match[2]}` : compact;
}
