# Consentimiento en servidor y AdSense: activación

Ambos quedan **desactivados o sin configurar** en el repositorio. Esta guía dice qué hacer para activarlos, en orden. Ninguna acción aquí se ha ejecutado contra producción.

## 1. Registro de consentimientos (servidor)

Depende de la API de me gusta (`workers/api`), que ya incluye la ruta `/consent`.

1. Aplicar la migración `supabase/migrations/0002_legal_consents.sql` en el proyecto de Supabase, después de la `0001`. Verificado con PostgreSQL real (PGlite) junto con las pruebas RLS, incluido un control negativo.
2. Desplegar el Worker de la API con esa versión (`npx wrangler@4.151.3 deploy` desde `workers/api/`).
3. Poner la URL del Worker en `src/config/services.json` → `apiBaseUrl`. Al compilar, la CSP añade ese origen a `connect-src`.
4. Comprobar desde un origen permitido:

   ```
   curl -s -X POST <worker>/consent -H "Origin: https://DeusStellaris.github.io" -H "Content-Type: application/json" \
     -d '{"type":"terms","granted":true,"documentVersion":"2026-11-05.1","locale":"es","visitorId":"3f2c9a8e-1b4d-4c7e-9f0a-2d6e8b7c5a14"}'
   ```

   Debe responder `201` con `acceptedAt` generado por la base de datos. Con una versión que no coincida, `400`.

Hasta entonces, el aviso muestra «pendiente de registro» y no marca nada como aceptado.

## 2. AdSense (publicidad)

**No activar sin tus credenciales y tu autorización expresa.** Pasos, en orden:

1. Verificar en la documentación vigente de Google los dominios que el sitio necesitará. La CSP actual los añade **solo** si `src/config/ads.json` tiene `enabled: true`:
   - `script-src` y `connect-src`: `https://pagead2.googlesyndication.com`
   - `frame-src`: `https://googleads.g.doubleclick.net`, `https://tpc.googlesyndication.com`
   - `img-src`: `https://pagead2.googlesyndication.com`, `https://tpc.googlesyndication.com`
     Esa lista no está verificada contra la documentación vigente de Google. Confírmala antes de activar.
2. Completar en `src/config/ads.json`: `publisherId` (formato `ca-pub-` seguido de 16 dígitos, dado por AdSense) y `slotId` de cada espacio. **No inventar ningún valor.**
3. Poner `enabled: true`. Sin `publisherId` válido el script **nunca** se carga, aunque el interruptor esté encendido.
4. Compilar y verificar: `npm run ci`. La prueba de build de publicidad se adapta al interruptor.

Con el interruptor apagado (estado actual) no se renderiza ningún espacio, no se reserva altura, no se carga ningún recurso de Google y la CSP no cambia.

### Comportamiento con el consentimiento

- El script de AdSense se inserta **solo** si el visitante concedió la preferencia de publicidad en el aviso o en la página de cookies. Sin esa decisión, el espacio muestra su marcador de reserva.
- Retirar la preferencia no puede descargar un script ya cargado: la página lo indica y se aplica en la siguiente carga completa.
- Los espacios reservan altura por breakpoint (100 px móvil, 250 px tablet, 600 px la columna lateral) para evitar desplazamientos de contenido.

## 3. Tareas que quedan a tu cargo

- Crear el proyecto de Supabase, aplicar `0001` y `0002`, y configurar las variables del Worker (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VISITOR_HASH_PEPPER`).
- Desplegar el Worker y poner su URL en `services.json`.
- Completar los datos legales de `legal.json` y los 34 marcadores de `docs/legal/pending-data.md`.
- Revisión profesional de los documentos antes de considerarlos definitivos.
- Decidir la activación de AdSense y aportar `publisherId` y `slotId`.
