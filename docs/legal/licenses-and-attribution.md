# Licencias y atribuciones

Revisión realizada leyendo el `package.json` instalado de cada dependencia directa. Las licencias de los recursos visuales no pueden verificarse desde el repositorio: se listan como pendientes.

## Dependencias de runtime (se publican en el sitio)

| Paquete                                                         | Versión | Licencia | Estado                                                                                |
| --------------------------------------------------------------- | ------- | -------- | ------------------------------------------------------------------------------------- |
| astro                                                           | 7.3.8   | MIT      | Verificada                                                                            |
| @astrojs/sitemap                                                | 3.7.4   | MIT      | Verificada                                                                            |
| @fontsource-variable/inter                                      | 5.3.0   | OFL-1.1  | Verificada. Fuente autoalojada; conservar el aviso de copyright de la OFL al mover.   |
| @fontsource/playfair-display, jetbrains-mono, silkscreen, vt323 | 5.3.0   | OFL-1.1  | Verificadas (igual que la anterior)                                                   |
| decap-cms-app (bundle en `/admin/`)                             | 3.17.1  | MIT      | Licencia verificada. **Riesgo de seguridad: ver `launch-readiness.md`.**              |
| giscus (servicio externo, desactivado)                          | —       | Servicio | Sin código propio; solo se carga tras la acción del visitante, y hoy está desactivado |

## Dependencias de desarrollo (no se publican, salvo lo indicado)

| Paquete                   | Versión | Licencia          |
| ------------------------- | ------- | ----------------- |
| @astrojs/check            | 0.9.12  | MIT               |
| @astrojs/markdown-satteri | 0.4.3   | MIT               |
| @biomejs/biome            | 2.6.5   | MIT OR Apache-2.0 |
| @playwright/test          | 1.64.1  | Apache-2.0        |
| @axe-core/playwright      | 4.14.0  | MPL-2.0           |
| lighthouse                | 13.5.0  | Apache-2.0        |
| typescript                | 5.9.3   | Apache-2.0        |

## Recursos visuales (pendientes de confirmación)

No se pudo verificar desde el repositorio quién creó ni con qué licencia se obtuvieron estos archivos. No se declara ninguna licencia para ellos.

| Recurso                                                                                                                                      | Uso en el sitio                | Pendiente                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `src/assets/backgrounds/marble-dark.webp` y `marble-light.webp` (generados desde los PNG originales, ahora en `_Deus_Assets/brand-sources/`) | Texturas de Inicio y Freelance | [PENDIENTE: autor y licencia de las texturas de mármol; confirmar derechos de uso] |
| `public/assets/logo/deus-samurai.webp` (y `Samurai Morado.png`, sin versionar)                                                               | Logotipo y bienvenida          | [PENDIENTE: titularidad del logotipo; confirmar que es obra propia o con licencia] |
| `public/favicon.svg`                                                                                                                         | Icono de pestaña               | [PENDIENTE: origen y licencia del favicon]                                         |
| Iconos de sección (`src/components/ui/SectionIcon.astro`)                                                                                    | Tarjetas de Inicio             | [PENDIENTE: confirmar si son trazados propios o de una biblioteca con licencia]    |

Los PNG originales de mármol (`marble-dark.png`, `marble-light.png`, unos 21 MB en total) no se usan en el build. Pueden retirarse del repositorio una vez confirmada la licencia de las versiones JPG.

## Atribuciones que deben aparecer

- Fuentes OFL-1.1 (Inter, Playfair Display, JetBrains Mono, Silkscreen, VT323): la OFL exige conservar el aviso de copyright y la licencia en las distribuciones. Fontsource los incluye en cada paquete; si se autoalojan copias sueltas, deben incluirse también.
- Decap CMS (MIT): conservar el aviso de copyright en el bundle, tal como lo entrega el paquete.
