// Utilidades compartidas por las funciones que gestionan cuentas de cliente.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.119.0';

// Sin caracteres que se confunden al dictarlos o leerlos (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Contraseña temporal legible, p. ej. "K7PM-Q4TX". */
export function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export async function findUserIdByEmail(admin: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

/** Solo el personal del taller (tabla staff, visible para sí mismo por RLS). */
export async function isStaff(supabase: SupabaseClient) {
  const { data } = await supabase.from('staff').select('name').maybeSingle();
  return data !== null;
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
