# Fase 3: inventario de componentes visuales

## Inventario

| Componente            | Archivo                                                                    | Responsabilidad                                 | Estados                                                | Interacción                                              |
| --------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Logotipo              | `components/ui/Logo.astro`                                                 | Marca y enlace a inicio                         | Normal, foco                                           | Enlace; destino de la bienvenida (`data-brand-mark`)     |
| Bienvenida            | `components/layout/IntroOverlay.astro` + `features/intro/intro.ts`         | Logotipo centrado que vuela al header; destello | Oculta (por defecto), reproduciendo, terminada         | Ninguna; `pointer-events: none`                          |
| Selector de tema      | `components/ui/ThemeToggle.astro` + `features/preferences/theme.ts`        | Morfado sol/luna; persiste y sigue al sistema   | `data-mode` = dark/light; `aria-label` dinámica        | Clic; foco visible                                       |
| Lite Mode             | `components/ui/LiteModeToggle.astro` + `features/preferences/lite-mode.ts` | Desactiva efectos costosos                      | `aria-pressed` true/false                              | Clic; foco visible                                       |
| Selector de idioma    | `components/ui/LanguagePill.astro`                                         | Pill deslizante ES/EN hacia la URL equivalente  | `aria-current` por idioma; indicador por `data-locale` | Enlaces (sin JavaScript)                                 |
| Icono de sección      | `components/ui/SectionIcon.astro`                                          | Identificador de cada sección                   | Decorativo                                             | Se desplaza entre enlaces del header (`transition:name`) |
| Tarjeta de sección    | `components/ui/SectionCard.astro`                                          | Acceso a cada sección desde Inicio              | Normal, hover, foco                                    | Enlace                                                   |
| Header                | `components/layout/SiteHeader.astro`                                       | Navegación y controles                          | Sticky; enlace activo marcado                          | Navegación por teclado completa                          |
| Portada               | `components/sections/HomeHero.astro`                                       | Presentación y tarjetas                         | —                                                      | —                                                        |
| Encabezado de sección | `components/sections/SectionIntro.astro`                                   | Título y descripción                            | —                                                      | —                                                        |

## Preferencias y cómo se aplican

- **Tema** (`deus:theme`): `public/js/preferences-init.js` lo aplica antes del primer pintado. Si el visitante no eligió, se sigue `prefers-color-scheme` en vivo.
- **Lite Mode** (`deus:lite-mode`): clase `lite-mode` en `<html>`. Las reglas de `styles/motion.css` desactivan animaciones, transiciones y transiciones de vista. No modifica `prefers-reduced-motion`.
- **Bienvenida** (`sessionStorage deus:intro-played`): una vez por sesión. Se omite en Lite Mode y con `prefers-reduced-motion`.

## Identidades de sección (`data-section` en `<body>`)

| Sección   | Archivo CSS                     | Fondo                       | Tipografía                         | Paleta        |
| --------- | ------------------------------- | --------------------------- | ---------------------------------- | ------------- |
| Inicio    | `styles/sections/home.css`      | Mármol + luz ambiental      | Inter                              | Sigue el tema |
| Juegos    | `styles/sections/games.css`     | Cuadrícula de plano técnico | Silkscreen (títulos), VT323 (lead) | Azul fija     |
| Programas | `styles/sections/programs.css`  | Terminal oscura             | JetBrains Mono                     | Terminal fija |
| Freelance | `styles/sections/freelance.css` | Luz editorial sobre mármol  | Playfair Display                   | Sigue el tema |

Juegos y Programas fijan su paleta porque el tema claro haría ilegible su fondo oscuro.

## Decisiones técnicas de la fase

1. **Sin atributos `style` en línea.** La CSP no permite estilos en atributos. El indicador del selector de idioma y el morfado usan clases y `data-*`.
2. **Un solo script de interactividad** (`features/bootstrap.ts`), importado una vez desde el layout. Los listeners usan delegación de eventos porque ClientRouter reemplaza los botones en cada navegación.
3. **Destello no infinito.** Un barrido único al terminar la bienvenida, para evitar animaciones continuas.
4. **Fondos SVG en `src/assets/backgrounds/`** (no en `public/`): los referencia CSS, y Vite los procesa con la ruta base correcta. Los placeholders del logotipo y las imágenes siguen en `public/assets/`.

## Pendiente de esta fase (no implementado)

- **Buscador, panel de perfil y asistente de interfaz.** Están en la lista original de la Fase 3, pero no en los pasos aprobados (1 a 10). No los marco como terminados.
- **Contenido real de las secciones** (proyectos, servicios). Hasta la Fase 4 se muestra el aviso de contenido en preparación.
- **Protección de correo** en la sección de contacto. Hoy solo se muestran enlaces de redes configuradas.

## Verificación

Ver `docs/STATUS.md`. Las pruebas en navegador no se pudieron ejecutar en este entorno.
