# Rendimiento y observabilidad (Etapa 3)

## Entrega estática y caché

- `public/_headers` define las cabeceras de caché (Cloudflare Pages / Netlify): `immutable` por un año para
  `/_astro/*` (nombres con hash), revalidación corta para HTML, `sw.js` y los JSON públicos.
- **GitHub Pages no admite cabeceras personalizadas**: aplica `Cache-Control: max-age=600` y compresión gzip. Para
  obtener caché inmutable y **Brotli** hay que servir el sitio desde Cloudflare Pages (Brotli viene activo por
  defecto en su CDN y en Workers; no requiere configuración) o poner Cloudflare delante del dominio propio.
- El Worker de la API responde `Cache-Control: no-store` salvo `GET /reviews`, que usa
  `public, max-age=15, stale-while-revalidate=60`. Tras publicar una reseña, el cliente fuerza una lectura fresca.

## Carga y datos

- Fuentes autoalojadas: Inter variable (cubre 400, 600 y 700), Playfair 400/700 y el resto solo 400 latino,
  con `font-display: swap` y fuentes de respaldo con métricas ajustadas.
- JavaScript dividido por página: galería del Hub, reseñas, demos, ficha de DeusDeck y comentarios se
  descargan solo si la página contiene su raíz (`src/features/bootstrap.ts`).
- Esqueletos de carga (`src/styles/skeleton.css`) en Hub, reseñas y ranking; reservan el tamaño final.
- Hub y reseñas se muestran por páginas ("Mostrar más"); la API de reseñas pagina con `offset` (10 por página).
- `src/lib/dedupe.ts` evita peticiones duplicadas; las lecturas independientes van en `Promise.all`.

## Base de datos (Supabase)

- Migración `0006_performance_indexes.sql`: índice parcial para `review_stats`, índices push por modo e idioma y
  por antigüedad; elimina dos índices redundantes. Las consultas piden solo las columnas necesarias y no hay N+1.
- **Connection pooling (Supavisor):** el Worker usa la API REST de Supabase (PostgREST), que ya agrupa conexiones.
  Si se agrega acceso SQL directo, usar la cadena **Transaction pooler** (puerto 6543) del panel de Supabase.

## Observabilidad

- Worker: `Server-Timing` en cada respuesta y una línea JSON `slow_request` (con `traceId` W3C) si tarda ≥ 800 ms.
  `[observability]` en `wrangler.toml` activa Workers Logs, exportables a OpenTelemetry desde el panel de Cloudflare.
- RUM (`src/features/rum/`): LCP, INP, CLS, FCP y TTFB de una fracción (10 %) de las visitas, enviados a
  `POST /vitals` al ocultar la página. Sin cookies, identificadores ni IP; respeta Do Not Track, Global Privacy
  Control y el ahorro de datos. El Worker solo registra la línea `rum`; no guarda nada.
