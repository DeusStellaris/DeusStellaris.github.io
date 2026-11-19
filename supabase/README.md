# Supabase / PostgreSQL

Base de datos de los "me gusta" y del ranking. Las escrituras las hace solo el Worker de la API (`workers/api`). El navegador lee contadores agregados mediante funciones RPC.

## Archivos

| Archivo                                  | Contenido                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `migrations/0001_likes_and_rankings.sql` | Tablas `likes` y `rate_limit_hits`, RLS, funciones y permisos                  |
| `migrations/0002_legal_consents.sql`     | Registro inmutable de consentimientos (términos, privacidad, publicidad)       |
| `migrations/0003_push_subscriptions.sql` | Suscripciones push con preferencias por modo, categoría y proyecto             |
| `tests/rls/rls.test.sql`                 | Pruebas de RLS, permisos y restricciones. Termina sin error si todo se cumple. |

## Modelo de seguridad

- **RLS activado** en todas las tablas y **sin políticas**: `anon` y `authenticated` no pueden leer ni escribir filas. El acceso a las tablas es solo de `service_role`.
- **Permisos revocados** explícitamente a `public`, `anon` y `authenticated` sobre tablas y funciones, y concedidos a `service_role` de forma explícita, sin depender de los privilegios por defecto.
- **Funciones públicas de solo lectura**: `get_like_count(slug)` y `get_project_rankings()` devuelven contadores agregados. No exponen visitantes ni hashes.
- **Funciones de servicio**: `consume_rate_limit` y `purge_rate_limit_hits` solo las ejecuta `service_role`.
- **`security definer` con `search_path` vacío** y nombres totalmente calificados, para evitar secuestro por `search_path`.
- **Restricciones de integridad**: formato del slug, hash de 64 caracteres hexadecimales y una sola fila por (proyecto, visitante).

## Aplicar la migración

Con la CLI de Supabase, versión fijada y publicada hace al menos dos semanas (verificar antes de usar):

```
npx supabase@<version> link --project-ref <ref>
npx supabase@<version> db push
```

Alternativa manual: ejecutar el SQL en el editor SQL del panel de Supabase. Es idempotente solo en las funciones (`create or replace`); la tabla no se recrea si ya existe, así que aplicarla dos veces falla por diseño.

## Pruebas RLS

`tests/rls/rls.test.sql` comprueba: que `anon` no puede insertar, leer, modificar ni borrar `likes`; que no puede leer ni ejecutar `rate_limit_hits` ni `consume_rate_limit`; que sí puede leer los contadores; que `service_role` respeta la unicidad y el límite; y las restricciones de formato. Los nombres de rol son los de Supabase.

Ejecución en un proyecto o instancia local de Supabase (`supabase start`), con `psql`:

```
psql "<cadena-de-conexion-local>" -f supabase/tests/rls/rls.test.sql
```

Control negativo: el script debe fallar si se concede `select` sobre `likes` a `anon`. Cada bloque lanza una excepción `FALLO: ...` con su causa.

### Verificación realizada en este entorno

La migración y el script de pruebas se ejecutaron contra PostgreSQL real (PGlite 0.5.11, PostgreSQL en WebAssembly), creando antes los roles `anon`, `authenticated` y `service_role` y los privilegios por defecto de Supabase. Resultado: **migración OK, pruebas RLS OK**. Control negativo: al conceder `select` a `anon`, la prueba 2 detecta `FALLO: anon pudo leer likes`.

No se ha ejecutado contra un proyecto real de Supabase, ni con la CLI, ni con la clave `service_role` real. Eso queda pendiente hasta que crees el proyecto.

## Limpieza

`purge_rate_limit_hits()` borra ventanas de más de dos días. Programarla con `pg_cron` o un trabajo periódico del Worker cuando haya tráfico real.
