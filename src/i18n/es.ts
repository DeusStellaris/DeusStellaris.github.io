// Diccionario de interfaz en español (idioma principal).
// Es el diccionario completo: cualquier clave nueva debe añadirse aquí primero.
// El tipo `Dictionary` se exporta para validar el resto de idiomas.

import { deckEs, hubEs } from './modules/deck';
import { accountEs, demosEs, reviewsEs } from './modules/demos';

const es = {
  deck: deckEs,
  hub: hubEs,
  demos: demosEs,
  reviews: reviewsEs,
  account: accountEs,
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
      contactCta: 'Contactame',
      contactCtaTooltip: 'Ir a la sección de contacto.',
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
  intro: {
    welcome: 'Bienvenido',
  },
  preferences: {
    themeToLight: 'Activar modo claro',
    themeToDark: 'Activar modo oscuro',
    liteMode: 'Modo rendimiento',
    liteModeHint:
      'Modo Lite activo por defecto para ahorrar CPU, GPU, RAM y batería. Pulsalo para encender los efectos ambientales completos; volvé a pulsarlo para ahorrar de nuevo.',
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
    closeTooltip: 'Cerrar el perfil (Esc)',
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
  legal: {
    draftNotice: 'PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO',
    version: 'Versión',
    footerTerms: 'Términos',
    footerPrivacy: 'Privacidad',
    footerCookies: 'Cookies',
    footerRefund: 'Reembolso',
    dataDeletionRequest: 'Solicitar borrado de datos / Cancelar suscripción',
    pendingTag: 'Dato pendiente',
  },
  consent: {
    title: 'Términos, privacidad y cookies',
    intro:
      'Antes de usar las funciones que guardan datos o se conectan a servicios, revisá y aceptá los documentos. Las decisiones opcionales son independientes.',
    termsLabel: 'He leído y acepto los Términos y condiciones de uso',
    privacyLabel: 'He leído y acepto la Política de privacidad',
    adsLabel: 'Acepto la publicidad no esencial cuando esté activa (opcional)',
    required: 'Para continuar, marcá los dos documentos obligatorios.',
    submit: 'Guardar mis decisiones',
    later: 'Más tarde',
    optionalLabel: 'Cookies opcionales (no son necesarias para usar el sitio):',
    optionalAccept: 'Aceptar cookies opcionales',
    optionalReject: 'Rechazar opcionales',
    docsLabel: 'Documentos legales',
    tooltipTerms: 'Abre los Términos y condiciones de uso.',
    tooltipPrivacy: 'Abre la Política de privacidad.',
    tooltipCookies: 'Abre la Política de cookies.',
    tooltipSubmit: 'Guarda tu aceptación de los documentos marcados.',
    tooltipReject:
      'Rechaza el almacenamiento y las cookies opcionales. El sitio sigue funcionando igual.',
    tooltipLater: 'Cierra este aviso hasta la próxima sesión sin guardar nada.',
    tooltipAccept: 'Acepta las cookies opcionales (publicidad no esencial).',
    close: 'Cerrar',
    registered: 'Aceptación registrada en el servidor.',
    serverPending:
      'No pudimos registrar tu aceptación en el servidor. Podés intentarlo de nuevo más tarde. El sitio no la da por registrada.',
    serverUnavailable:
      'El registro de aceptaciones todavía no está disponible. El sitio no la da por registrada.',
    localSaved: 'Tus decisiones de cookies se guardaron en este navegador.',
    open: 'Revisar consentimientos',
    manageTitle: 'Preferencias de cookies',
    manageIntro: 'Podés cambiar estas decisiones cuando quieras.',
    adsDisabled: 'Actualmente no hay publicidad activa en el sitio.',
    statusRegistered: 'Registrado',
    statusPending: 'Pendiente de registro',
  },
  ads: {
    placeholder: 'Espacio publicitario',
    waiting: 'La publicidad se mostrará solo si aceptás la preferencia de publicidad.',
  },
  offline: {
    title: 'Sin conexión',
    body: 'No hay conexión y esta página todavía no se guardó en tu dispositivo. Volvé a intentarlo cuando te reconectes.',
    back: 'Ir al inicio',
  },
  push: {
    open: 'Notificaciones',
    openHint: 'Elegí qué avisos querés recibir. Solo se activan si vos lo decidís.',
    title: 'Preferencias de notificaciones',
    close: 'Cerrar',
    intro:
      'Elegí qué querés recibir. Los avisos llegan solo a este dispositivo y podés cambiarlos o apagarlos cuando quieras.',
    modeGroup: 'Qué avisos recibir',
    categoriesGroup: 'Categorías',
    projectsGroup: 'Proyectos puntuales',
    impactTitle: 'Impacto estimado',
    impactBattery: 'Batería',
    impactData: 'Datos en segundo plano',
    detailHint: 'Pasá el mouse o enfocá una opción para ver su detalle.',
    categoryTooltip: 'Recibir avisos de esta sección.',
    projectTooltip: 'Recibir avisos de este proyecto.',
    enable: 'Activar en este dispositivo',
    enableHint: 'Pide permiso al navegador para mostrar avisos en este dispositivo.',
    modes: {
      all: {
        label: 'Todo',
        tooltip: 'Recibir un aviso por cada novedad del sitio.',
        description:
          'Un aviso por cada novedad publicada, sin importar la sección. Es la opción más completa.',
        battery: 'Baja: cada aviso despierta el dispositivo unos segundos.',
        data: 'Cerca de 1 a 2 KB por aviso, unos pocos por semana.',
      },
      none: {
        label: 'Nada',
        tooltip: 'No recibir avisos y cancelar la suscripción de este dispositivo.',
        description:
          'No llega ningún aviso. Se cancela la suscripción de este dispositivo y se borra del servidor.',
        battery: 'Ninguno.',
        data: 'Ninguno.',
      },
      categories: {
        label: 'Por categoría',
        tooltip: 'Elegir una o más secciones: Juegos, Programas o Freelance.',
        description:
          'Solo recibís avisos de las secciones que marques: Juegos, Programas o Freelance.',
        battery: 'Muy baja: llegan menos avisos que con Todo.',
        data: 'Menos de 1 KB por semana, según lo que elijas.',
      },
      projects: {
        label: 'Por proyecto',
        tooltip: 'Seguir proyectos puntuales, por ejemplo DeusDeck.',
        description:
          'Solo recibís avisos de los proyectos que sigas, como DeusDeck. Es la opción más silenciosa.',
        battery: 'Mínima: solo avisos de lo que seguís.',
        data: 'Mínimos: unos pocos KB al mes.',
      },
    },
    status: {
      off: 'Las notificaciones están apagadas en este dispositivo.',
      needsPermission:
        'Tus preferencias están guardadas. Falta activar las notificaciones en este dispositivo.',
      active: 'Activas en este dispositivo. Los cambios se guardan solos.',
      denied:
        'El navegador bloqueó las notificaciones. Habilitalas en los permisos del sitio para activarlas.',
      unsupported: 'Este navegador no admite notificaciones push.',
      unconfigured:
        'Preferencias guardadas en este dispositivo. Los avisos se activarán cuando el servicio de notificaciones esté disponible.',
      saving: 'Guardando…',
      error: 'No se pudo completar la acción. Intentalo de nuevo más tarde.',
    },
    ios: 'En iPhone y iPad primero tenés que instalar la app: tocá Compartir, elegí "Agregar a pantalla de inicio" y abrila desde su ícono. Después podrás activar las notificaciones.',
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
