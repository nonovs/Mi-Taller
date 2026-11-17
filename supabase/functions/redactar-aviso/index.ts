// Edge Function: convierte una nota del mecánico (audio o texto) en un aviso formal para el cliente.
// Audio → Groq Whisper (transcripción) → Claude (redacción). No publica nada: devuelve un borrador
// que el mecánico revisa en la app antes de publicarlo.
//
// Secretos: GROQ_API_KEY (obligatorio para audio) y ANTHROPIC_API_KEY (opcional). Sin Claude, o si
// Claude falla, se devuelve la transcripción tal cual con polished: false para que el mecánico la pula.

import Anthropic from 'npm:@anthropic-ai/sdk@1.9.0';
import { withSupabase } from 'npm:@supabase/server@1.9.2';

const anthropic = Deno.env.get('ANTHROPIC_API_KEY') ? new Anthropic() : null;

const STATUS_LABEL: Record<string, string> = {
  recibido: 'recibido en el taller',
  diagnostico: 'en diagnóstico',
  en_reparacion: 'en reparación',
  listo: 'listo para recoger',
  entregado: 'entregado',
};

// Palabras del oficio para que Whisper acierte la ortografía (máx. 224 tokens).
const WHISPER_HINT =
  'Nota de un mecánico de taller: pastillas de freno, discos, embrague, correa de distribución, ' +
  'amortiguadores, filtro de aceite, aceite 5W30, ITV, centralita, diagnosis, neumáticos, alineado.';

const SYSTEM_PROMPT = `Redactas los avisos que un taller mecánico de España envía a sus clientes a través de su app. \
Recibes una nota rápida de un mecánico, a menudo dictada por voz y transcrita automáticamente, y la conviertes en un \
mensaje claro, cordial y profesional para el dueño del coche.

Cómo escribir el aviso:
- Escribe en español de España, hablando de usted al cliente y en nombre del taller ("hemos revisado...").
- Conserva todos los datos de la nota: piezas, averías, medidas, precios, plazos. No añadas datos, precios, fechas ni diagnósticos que la nota no diga; si algo no está claro, déjalo en términos generales en vez de inventarlo.
- Si aparece un término técnico que un cliente normal no entendería, añade una aclaración breve entre paréntesis o en la misma frase.
- La transcripción puede tener errores típicos del dictado (palabras mal reconocidas, muletillas, frases cortadas). Corrígelos cuando el sentido sea evidente por el contexto del taller.
- Omite comentarios internos que no van dirigidos al cliente (bromas, quejas, notas para compañeros).
- Sé breve: de una a tres frases cortas o un párrafo pequeño. Sin saludo largo, sin firma (la app ya muestra quién lo envía) y sin formato Markdown.

Responde solo con el texto del aviso.`;

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

    // ctx.supabase respeta RLS: un cliente no tiene fila en staff y no ve coches ajenos.
    const { data: staff } = await ctx.supabase.from('staff').select('name').maybeSingle();
    if (!staff) return json({ error: 'Solo el personal del taller puede redactar avisos.' }, 403);

    const form = await req.formData();
    const vehicleId = form.get('vehicle_id');
    const audio = form.get('audio');
    const text = form.get('text');

    if (typeof vehicleId !== 'string') return json({ error: 'Falta vehicle_id.' }, 400);
    const { data: vehicle } = await ctx.supabase
      .from('vehicles')
      .select('plate, brand, model, status')
      .eq('id', vehicleId)
      .maybeSingle();
    if (!vehicle) return json({ error: 'Coche no encontrado.' }, 404);

    let source: 'audio' | 'texto';
    let original: string;
    try {
      if (audio instanceof File) {
        source = 'audio';
        original = await transcribe(audio);
      } else if (typeof text === 'string' && text.trim()) {
        source = 'texto';
        original = text.trim();
      } else {
        return json({ error: 'Envía un audio o un texto.' }, 400);
      }

      if (!original) {
        return json({ error: 'No se ha entendido el audio. Prueba a grabarlo otra vez.' }, 422);
      }

      if (!anthropic) {
        return json({ source, original, message: original, polished: false });
      }
      try {
        const message = await draftMessage(anthropic, original, vehicle);
        return json({ source, original, message, polished: true });
      } catch (error) {
        // La transcripción ya está hecha: mejor un borrador sin pulir que perder la nota de voz.
        console.error(error);
        return json({ source, original, message: original, polished: false, warning: describeError(error) });
      }
    } catch (error) {
      console.error(error);
      return json({ error: describeError(error) }, 502);
    }
  }),
};

async function transcribe(audio: File): Promise<string> {
  const body = new FormData();
  body.append('file', audio, audio.name || 'nota.m4a');
  body.append('model', 'whisper-large-v3');
  body.append('language', 'es');
  body.append('prompt', WHISPER_HINT);
  body.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}` },
    body,
  });
  if (!response.ok) {
    throw new TranscriptionError(`Groq respondió ${response.status}: ${await response.text()}`);
  }
  const result: { text: string } = await response.json();
  return result.text.trim();
}

async function draftMessage(
  anthropic: Anthropic,
  original: string,
  vehicle: { plate: string; brand: string; model: string; status: string },
): Promise<string> {
  const response = await anthropic.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    output_config: { effort: 'low' },
    // Si un clasificador rechazara la petición, la API la reintenta en el modelo recomendado.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content:
          `<coche>${vehicle.brand} ${vehicle.model}, matrícula ${vehicle.plate}, ` +
          `estado: ${STATUS_LABEL[vehicle.status] ?? vehicle.status}</coche>\n\n` +
          `<nota_del_mecanico>\n${original}\n</nota_del_mecanico>`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new DraftError('La IA no ha podido redactar este aviso. Escríbelo a mano.');
  }

  const message = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  if (!message) throw new DraftError('La IA ha devuelto un aviso vacío. Prueba otra vez.');
  return message;
}

class TranscriptionError extends Error {}
class DraftError extends Error {}

function describeError(error: unknown): string {
  if (error instanceof DraftError) return error.message;
  if (error instanceof TranscriptionError) return 'No se ha podido transcribir el audio. Prueba otra vez.';
  if (error instanceof Anthropic.RateLimitError) return 'La IA está saturada ahora mismo. Prueba en un minuto.';
  if (error instanceof Anthropic.APIError) return 'La IA no está disponible ahora mismo. Prueba otra vez.';
  return 'Error inesperado al redactar el aviso.';
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
