# MiTaller

Dos apps móviles que comparten la misma base de datos:

- **app-cliente**: el cliente inicia sesión y ve su coche (con matrícula), el estado, los trabajos y los **mensajes del taller** en tiempo real, sin tener que llamar.
- **app-taller**: el mecánico da de alta coches (y la cuenta del cliente), cambia estados, ordena las tareas arrastrándolas y escribe al cliente por chat. Un mensaje escrito se envía tal cual; con ✨ la IA lo redacta mejor; con el micrófono la nota de voz se transcribe (Groq Whisper) y, si la IA está activa, se pule (Claude). Todo lo que pasa por la IA se revisa antes de enviarlo.

```
app-cliente/        App del cliente (Expo SDK 58)
app-taller/         App del mecánico (Expo SDK 58)
supabase/
  schema.sql        Coches y tareas + seguridad (cada cliente solo ve lo suyo)
  taller.sql        Mecánicos, avisos al cliente y originales (solo los ve el taller)
  v2.sql            Fichas de cliente, alta de coches por el taller, reordenar tareas
  seed.sql          Coche de prueba
  functions/
    redactar-aviso/ Audio/texto → transcripción → aviso formal (sin Claude devuelve la transcripción)
    alta-coche/     Alta de coche + cuenta del cliente con contraseña temporal
    nueva-clave/    Nueva contraseña temporal para un cliente
  templates/        Emails con código (pendientes: requieren SMTP propio)
```

## Alta de un cliente

1. El mecánico pulsa **Nuevo coche**, rellena cliente, coche y trabajos.
2. Si el email no tiene cuenta, se crea con una **contraseña temporal** que la app muestra para enviarla por WhatsApp.
3. Al entrar por primera vez, la app del cliente le obliga a crear su propia contraseña.
4. Si la olvida, el mecánico genera otra desde la pestaña **Ficha** del coche.

> Invitar por email requiere un servidor de correo propio (SMTP): el plan gratuito de Supabase solo envía emails al equipo del proyecto y no deja editar las plantillas.

## Cómo funciona un aviso

1. **Texto escrito**: se envía al cliente tal cual al pulsar enviar. Con ✨ pasa antes por la IA.
2. **Nota de voz**: la Edge Function `redactar-aviso` la transcribe con Groq Whisper y, si hay `ANTHROPIC_API_KEY`, Claude la convierte en un mensaje claro. Sin clave (o si Claude falla) devuelve la transcripción literal y la app avisa de que no se ha pulido.
3. Todo lo que pasa por la IA se muestra como borrador: el mecánico lo corrige si hace falta y pulsa **Enviar al cliente**.
4. El cliente lo ve al momento en la ficha de su coche. El audio no se guarda; el texto original queda en `vehicle_update_sources`, que solo ve el taller.

## Puesta en marcha

### 1. Base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta por orden `supabase/schema.sql`, `supabase/taller.sql` y `supabase/v2.sql`.
3. En **Authentication → Users → Add user**, crea un cliente y un mecánico (marca *Auto Confirm User*).
4. Cambia el email en `supabase/seed.sql` por el del cliente y ejecútalo.
5. Da de alta al mecánico (cambia el email y el nombre):
   ```sql
   insert into staff (user_id, name)
   select id, 'Manolo' from auth.users where email = 'mecanico@ejemplo.com';
   ```

### 2. La función de IA

Necesitas una clave de [Anthropic](https://platform.claude.com) y otra de [Groq](https://console.groq.com) (tiene capa gratuita).

```bash
cd ~/Escritorio/MiTaller
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF      # Project Settings → General
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... GROQ_API_KEY=gsk_...
npx supabase functions deploy redactar-aviso
npx supabase functions deploy alta-coche
npx supabase functions deploy nueva-clave
```

### 3. Las apps

En **cada** app, copia `.env.example` a `.env` y pon la URL y la *publishable key* del proyecto (Project Settings → API Keys). Luego:

```bash
cd app-cliente   # o app-taller
npx expo start
```

Escanea el código QR con **Expo Go**. Para probar las dos a la vez, arráncalas en dos terminales (la segunda pedirá otro puerto).

## Comandos útiles (dentro de cada app)

```bash
npx expo start      # servidor de desarrollo
npx expo lint       # lint
npx tsc --noEmit    # comprobar tipos
npx expo-doctor     # revisar dependencias
```
