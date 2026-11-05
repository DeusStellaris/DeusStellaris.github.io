// Diccionario de interfaz en español (idioma principal).
// Es el diccionario completo: cualquier clave nueva debe añadirse aquí primero.
// El tipo `Dictionary` se exporta para validar el resto de idiomas.

const es = {
  common: {
    skipToContent: 'Saltar al contenido',
    siteName: 'Deus',
    languageSwitchLabel: 'Idioma',
  },
  nav: {
    home: 'Inicio',
    games: 'Juegos',
    programs: 'Programas',
    freelance: 'Freelance',
    contact: 'Contacto',
    primaryLabel: 'Navegación principal',
  },
  sections: {
    home: {
      title: 'Deus',
      subtitle: 'Entornos técnicos, creación de contenido y desarrollo a medida.',
      exploreHeading: 'Explorá las secciones',
    },
    games: {
      title: 'Juegos',
      intro:
        'Proyectos relacionados con videojuegos: entornos personalizados, modelado y desarrollo.',
    },
    programs: {
      title: 'Programas',
      intro: 'Herramientas, software y proyectos de programación.',
    },
    freelance: {
      title: 'Freelance',
      intro: 'Servicios profesionales de desarrollo y diseño técnico.',
    },
    contact: {
      title: 'Contacto',
      intro: 'Podés escribirme por correo o encontrarme en mis redes.',
      noLinks: 'Los medios de contacto se publicarán próximamente.',
    },
  },
  projects: {
    latestHeading: 'Últimos proyectos',
    emptyHome: 'Todavía no hay proyectos publicados. Volvé pronto.',
    emptySection: 'Todavía no hay proyectos publicados en esta sección.',
    viewProject: 'Ver proyecto',
    published: 'Publicado',
    updated: 'Actualizado',
    featured: 'Destacado',
    collaborators: 'Colaboradores',
    gallery: 'Galería',
    externalLinks: 'Enlaces',
    backToSection: 'Volver a',
    fallbackNotice: 'Esta versión del proyecto solo está disponible en español.',
    category: 'Categoría',
  },
  preferences: {
    themeToLight: 'Activar modo claro',
    themeToDark: 'Activar modo oscuro',
    liteMode: 'Modo rendimiento',
    liteModeHint: 'Reduce animaciones y efectos visuales',
  },
  notFound: {
    title: 'Página no encontrada',
    body: 'La dirección que buscás no existe o fue movida.',
    back: 'Volver al inicio',
  },
};

export default es;

/** Forma completa del diccionario, usada como contrato para los demás idiomas. */
export type Dictionary = typeof es;
