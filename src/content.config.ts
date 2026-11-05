import { defineCollection, type ImageFunction, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Colecciones de contenido editorial. Decap CMS escribe estos archivos en el repositorio
 * (ver public/admin/config.yml). Los campos en snake_case coinciden con los nombres de Decap.
 *
 * Un proyecto tiene una versión por idioma en `projects/<idioma>/<slug>.md`. El slug es el
 * nombre del archivo y se comparte entre idiomas. Las referencias a colaboradores y categorías
 * guardan solo el id (nombre del archivo), nunca una copia de sus datos.
 */

const SECTION_IDS = ['games', 'programs', 'freelance'] as const;

/** Solo enlaces HTTPS: evita esquemas como javascript: o data: en contenido editorial. */
const externalLinkSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.url({ protocol: /^https$/ }),
});

const imageWithAltSchema = (image: ImageFunction) =>
  z.object({
    image: image(),
    alt: z.string().min(1).max(160),
  });

const categories = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/categories' }),
  schema: z.object({
    label: z.string().min(1).max(60),
    label_en: z.string().min(1).max(60).optional(),
    section: z.enum(SECTION_IDS),
  }),
});

const collaborators = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/collaborators' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(80),
      alias: z.string().min(1).max(60).optional(),
      description: z.string().max(400).optional(),
      avatar: image().optional(),
      links: z.array(externalLinkSchema).max(10).default([]),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(100),
      summary: z.string().min(1).max(200),
      section: z.enum(SECTION_IDS),
      category: reference('categories').optional(),
      tags: z.array(z.string().min(1).max(30)).max(10).default([]),
      cover: imageWithAltSchema(image),
      gallery: z.array(imageWithAltSchema(image)).max(12).default([]),
      published_at: z.coerce.date(),
      updated_at: z.coerce.date().optional(),
      status: z.enum(['draft', 'published']).default('draft'),
      featured: z.boolean().default(false),
      collaborators: z.array(reference('collaborators')).max(10).default([]),
      external_links: z.array(externalLinkSchema).max(10).default([]),
    }),
});

export const collections = { projects, collaborators, categories };
