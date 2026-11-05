# Modelo de contenido

El contenido editorial vive en el repositorio como archivos Markdown y de imagen. Decap CMS lo escribe; Astro Content Collections lo valida en cada build. Los esquemas están en `src/content.config.ts`, y los campos de Decap en `public/admin/config.yml`. Los dos deben coincidir.

## Colecciones

| Colección       | Carpeta                                   | Un archivo es                       | Idiomas                      |
| --------------- | ----------------------------------------- | ----------------------------------- | ---------------------------- |
| `projects`      | `src/content/projects/<idioma>/<slug>.md` | Un proyecto en un idioma            | ES y EN                      |
| `collaborators` | `src/content/collaborators/<slug>.md`     | Una persona o entidad colaboradora  | Un solo idioma               |
| `categories`    | `src/content/categories/<slug>.md`        | Una categoría, ligada a una sección | Etiqueta en ES y EN opcional |

## Identidad de un proyecto

- El **slug** es el nombre del archivo. Se comparte entre idiomas: `projects/es/mi-proyecto.md` y `projects/en/mi-proyecto.md` son la misma obra en dos idiomas.
- El **id** interno de Astro es `es/mi-proyecto` o `en/mi-proyecto`.
- Un proyecto puede existir en un solo idioma.

## Campos de un proyecto

| Campo            | Tipo                                             | Obligatorio              | Notas                                                                        |
| ---------------- | ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------- |
| `title`          | texto, 1 a 100                                   | sí                       |                                                                              |
| `summary`        | texto, 1 a 200                                   | sí                       | Se muestra en la tarjeta y en `meta description`.                            |
| `section`        | `games` · `programs` · `freelance`               | sí                       | Decide en qué sección aparece.                                               |
| `category`       | referencia a `categories`                        | no                       |                                                                              |
| `tags`           | lista de textos, hasta 10                        | no                       |                                                                              |
| `cover`          | `{ image, alt }`                                 | sí                       | `alt` obligatorio: texto alternativo real.                                   |
| `gallery`        | lista de `{ image, alt }`, hasta 12              | no                       |                                                                              |
| `published_at`   | fecha                                            | sí                       | Determina el orden.                                                          |
| `updated_at`     | fecha                                            | no                       |                                                                              |
| `status`         | `draft` · `published`                            | sí (por defecto `draft`) | Solo `published` se publica.                                                 |
| `featured`       | booleano                                         | no                       | Marca visual en la tarjeta. **No cambia qué proyectos aparecen en el feed.** |
| `collaborators`  | lista de referencias a `collaborators`, hasta 10 | no                       | Solo se guarda el id.                                                        |
| `external_links` | lista de `{ label, url }`, hasta 10              | no                       | Solo `https://`.                                                             |
| Cuerpo           | Markdown                                         | sí                       | Sin HTML crudo (ver seguridad).                                              |

## Reglas de visibilidad (`src/services/projects.ts`)

1. Solo se muestra contenido con `status: published`.
2. Para un idioma se usa su versión si está publicada. Si no, se usa la versión en español (fallback suave). La página en inglés muestra un aviso cuando es el caso.
3. Un proyecto sin versión publicada en ningún idioma no genera páginas ni aparece en listados.
4. Orden: `published_at`, de más reciente a más antiguo.
5. **Feed de inicio**: los tres proyectos publicados más recientes, sin filtrar por sección.
6. **Secciones**: proyectos publicados de esa sección. Si no hay ninguno, se muestra un estado vacío.

## Colaboradores

Un colaborador es una entidad independiente. Un proyecto solo guarda su **id**; los datos (nombre, alias, descripción, avatar, enlaces) se leen al compilar. Cambiar un colaborador actualiza todos sus proyectos sin editarlos uno a uno. Una referencia a un colaborador inexistente **hace fallar el build**, para que nunca se publique un enlace roto.

## Imágenes

- Se guardan en `src/assets/uploads/`. Astro las optimiza a AVIF y WebP al compilar.
- `image()` solo acepta formatos de imagen. Un archivo que no sea imagen también hace fallar el build.
- La ruta que escribe Decap es relativa al archivo de contenido (`../../../assets/uploads/...` desde `projects/<idioma>/`).

## Seguridad del contenido

- El Markdown **no puede incluir HTML crudo**: el plugin `config/markdown/no-raw-html.mjs` elimina los nodos HTML antes de generar la página. Verificado en el build con un `<script>` y un `onerror`: ninguno llega al HTML.
- Los enlaces externos solo aceptan `https://` y se abren con `rel="noopener noreferrer"`.
- Aunque el contenido llegara a inyectar algo, la CSP del sitio bloquea los scripts sin hash.

## Verificado en build

Con contenido de prueba (ya eliminado), el pipeline cumplió:

- Borrador: no genera página, no aparece en feeds ni en el sitemap.
- Fallback: `/en/projects/<slug>/` muestra la versión española con aviso cuando no hay versión inglesa.
- Solo en inglés: aparece en el feed y la sección de inglés, no en español.
- Feed de inicio: orden descendente por `published_at`, sin el borrador.
- Colaborador y categoría: se resuelven y se muestran en la página de detalle.
- `hreflang` y canonical correctos en la página de detalle.
- Imágenes en AVIF y WebP.

No se han probado todavía las interacciones del CMS en navegador.
