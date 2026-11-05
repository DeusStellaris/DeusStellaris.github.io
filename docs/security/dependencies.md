# Seguridad de dependencias

## Estado actual

- `npm audit --omit=dev` (dependencias de producción): **0 vulnerabilidades**. Es lo que se publica.
- `npm audit` (incluye desarrollo): **30 avisos**, todos originados en `decap-cms-app@3.17.1` y sus dependencias.

## Por qué hay avisos de Decap

Decap se publica como un bundle compilado (`dist/*.js`). Las versiones vulnerables de sus dependencias están **dentro de ese bundle**. Un `overrides` en `package.json` no lo corrige, porque el código que se sirve es el del bundle, no el de `node_modules`.

Avisos relevantes (todos en el bundle del editor de `/admin`):

| Paquete                                               | Severidad | Resumen                                                                                                                                                                                         |
| ----------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trim`                                                | alta      | ReDoS en expresiones regulares (`<0.0.3`)                                                                                                                                                       |
| `remark-parse`, `remark-rehype`, `mdast-util-to-hast` | alta      | Dependencias del procesamiento Markdown del editor                                                                                                                                              |
| `@platejs/core`                                       | moderada  | Deserialización de HTML con comportamiento inesperado en el navegador (`<53.3.11`). Solo afecta al editor de texto enriquecido, que este proyecto **no usa** (los campos son Markdown y texto). |
| `minimatch`                                           | moderada  | Denegación de servicio por amplificación de patrones                                                                                                                                            |
| `uuid`                                                | moderada  | Verificación de límites de buffer en v3/v5/v6                                                                                                                                                   |
| `deepmerge`                                           | baja      | Contaminación de prototipo en `mergeObject()`                                                                                                                                                   |

## Alternativas consideradas

- **`decap-cms-app@3.16.0`**: 30 avisos, la misma cantidad. No mejora nada.
- **`decap-cms-app@3.17.3`**: publicada hace 10 días; no cumple la regla de dos semanas.
- **Quitar Decap**: el CMS es un requisito de la Fase 4.

Se mantiene **3.17.1**, la versión más reciente que cumple la regla de antigüedad.

## Mitigaciones aplicadas

1. El editor solo se sirve en `/admin`, con CSP propia y `noindex`.
2. El editor se usa después de autenticarse. El riesgo de explotación es bajo, porque requiere que el contenido procesado sea malicioso.
3. La CSP del sitio no cambia y no permite scripts sin hash.
4. El campo de texto enriquecido no está configurado; el de Markdown sí.
5. Los avisos se reevalúan con cada actualización de Decap.

## Decisión pendiente

**Esta aceptación del riesgo requiere confirmación explícita del titular del sitio.** Hasta entonces, el bundle de Decap queda marcado como riesgo aceptado provisionalmente. Opciones:

- Aceptar el riesgo documentado y reevaluar en cada versión de Decap.
- Esperar a una versión de Decap que actualice estas dependencias.
- Retirar `/admin` y usar otro flujo de edición.

## Cómo volver a comprobar

```
npm run audit        # producción: debe ser 0
npm audit            # completo: revisar que no aparezcan avisos nuevos fuera de decap-cms-app
```
