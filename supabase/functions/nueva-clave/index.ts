// Edge Function: el taller genera una contraseña temporal nueva para un cliente que ha olvidado
// la suya. La app del cliente le pedirá cambiarla al entrar.

import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { isStaff, json, temporaryPassword } from '../_shared/accounts.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    if (!(await isStaff(ctx.supabase))) {
      return json({ error: 'Solo el personal del taller puede cambiar contraseñas.' }, 403);
    }

    const { client_id: clientId } = (await req.json().catch(() => ({}))) as { client_id?: string };
    if (!clientId) return json({ error: 'Falta client_id.' }, 400);

    // Solo cuentas con ficha de cliente: así nunca se toca la cuenta de un mecánico.
    const { data: client } = await ctx.supabaseAdmin
      .from('clients')
      .select('user_id, email')
      .eq('user_id', clientId)
      .maybeSingle();
    if (!client) return json({ error: 'Cliente no encontrado.' }, 404);

    const password = temporaryPassword();
    const { error } = await ctx.supabaseAdmin.auth.admin.updateUserById(client.user_id, {
      password,
      user_metadata: { must_change_password: true },
    });
    if (error) return json({ error: error.message }, 500);

    return json({ client_email: client.email, temporary_password: password });
  }),
};
