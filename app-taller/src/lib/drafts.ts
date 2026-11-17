import { FunctionsHttpError } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/** Borrador que devuelve la Edge Function `redactar-aviso`. */
export type Draft = {
  source: 'audio' | 'texto';
  /** Transcripción literal o texto tal cual lo escribió el mecánico. */
  original: string;
  /** Aviso para el cliente: redactado por la IA, o el original si la IA no está disponible. */
  message: string;
  /** false si la IA no ha pulido el texto (no configurada o con error). */
  polished: boolean;
};

export type DraftInput = { audioUri: string } | { text: string };

export async function requestDraft(vehicleId: string, input: DraftInput): Promise<Draft> {
  const form = new FormData();
  form.append('vehicle_id', vehicleId);

  if ('audioUri' in input) {
    const name = input.audioUri.split('/').pop() || 'nota.m4a';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(input.audioUri)).blob();
      form.append('audio', blob, name);
    } else {
      // En Android/iOS, FormData sube el archivo directamente desde su URI.
      form.append('audio', { uri: input.audioUri, name, type: 'audio/m4a' } as unknown as Blob);
    }
  } else {
    form.append('text', input.text);
  }

  const { data, error } = await supabase.functions.invoke<Draft>('redactar-aviso', { body: form });
  if (error) throw new Error(await describeFunctionError(error));
  if (!data) throw new Error('Respuesta vacía del servidor.');
  return data;
}

/** Publica un aviso al cliente. `original` es lo que dijo/escribió el mecánico (solo lo ve el taller). */
export async function publishUpdate(
  vehicleId: string,
  message: string,
  source: Draft['source'],
  original: string,
) {
  const { error } = await supabase.rpc('publish_update', {
    p_vehicle_id: vehicleId,
    p_message: message,
    p_source: source,
    p_original: original,
  });
  if (error) throw new Error(error.message);
}

async function describeFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: { error?: string } = await error.context.json();
      if (body.error) return body.error;
    } catch {
      // Respuesta sin JSON: usamos el mensaje genérico.
    }
  }
  return 'No se ha podido conectar con el servidor. Revisa la conexión.';
}
