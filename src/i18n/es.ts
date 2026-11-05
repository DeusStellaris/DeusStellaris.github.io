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
    search: 'Buscar',
    ranking: 'Ranking',
    profile: 'Perfil',
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
  search: {
    heading: 'Buscar',
    label: 'Texto a buscar',
    placeholder: 'Buscá proyectos, juegos, programas o servicios',
    filterLabel: 'Filtrar por sección',
    filterAll: 'Todas las secciones',
    loading: 'Cargando el buscador…',
    error: 'No se pudo cargar el buscador. Revisá tu conexión e intentá de nuevo.',
    retry: 'Reintentar',
    hint: 'Escribí al menos dos letras para buscar.',
    noResults: 'No encontramos resultados para “{query}”.',
    resultsCount: '{count} resultados',
    typeSection: 'Sección',
    typeProject: 'Proyecto',
    clear: 'Limpiar búsqueda',
  },
  assistant: {
    open: 'Abrir asistente de búsqueda',
    close: 'Cerrar asistente',
    title: 'Asistente de búsqueda',
    intro: 'Buscá por nombre, descripción o categoría. Busca solo en el contenido de este sitio.',
    contextHint: 'Los resultados de esta sección aparecen primero.',
  },
  favorites: {
    add: 'Añadir a favoritos',
    remove: 'Quitar de favoritos',
    added: 'Añadido a favoritos',
    removed: 'Quitado de favoritos',
    unavailable: 'Este navegador no permite guardar favoritos. Se perderán al recargar la página.',
  },
  profile: {
    open: 'Perfil local',
    title: 'Tu perfil local',
    privacy:
      'Este perfil es anónimo y se guarda solo en este navegador. No hay cuenta ni datos enviados a un servidor.',
    favoritesHeading: 'Favoritos',
    noFavorites: 'Todavía no marcaste proyectos como favoritos.',
    preferencesHeading: 'Preferencias',
    themeLabel: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    liteLabel: 'Modo rendimiento',
    on: 'Activado',
    off: 'Desactivado',
    close: 'Cerrar',
    remove: 'Quitar',
    clearAll: 'Borrar favoritos',
  },
  likes: {
    like: 'Me gusta',
    liked: 'Te gusta',
    count: '{count} me gusta',
    error: 'No se pudo registrar tu me gusta. Intentalo más tarde.',
    unconfigured: 'Los me gusta todavía no están disponibles.',
  },
  ranking: {
    heading: 'Ranking de proyectos',
    intro: 'Los proyectos con más me gusta de todo el portafolio.',
    filterLabel: 'Filtrar por categoría',
    filterAll: 'Todas las categorías',
    loading: 'Cargando ranking…',
    error: 'No se pudo cargar el ranking. Intentalo más tarde.',
    unconfigured: 'El ranking todavía no está disponible.',
    empty: 'Todavía no hay me gusta registrados.',
    position: 'Puesto',
  },
  comments: {
    heading: 'Comentarios',
    disabled: 'Los comentarios todavía no están activos.',
    load: 'Cargar comentarios',
    loadError: 'No se pudieron cargar los comentarios. Podés intentarlo más tarde.',
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
