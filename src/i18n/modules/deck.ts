// Textos de la ficha de DeusDeck y del DeusDeck Hub (es / en).

export const deckEs = {
  badge: 'Prueba privada',
  programsLabel: 'Programas',
  lead: 'Tu panel de control para la PC, el stream y el escritorio, manejado desde el celular por la red local.',
  statusTitle: 'Estado: prueba privada',
  statusBody:
    'DeusDeck está en prueba cerrada. Los instaladores todavía no son públicos y este sitio no distribuye ningún binario hasta que termine esa etapa.',
  featuresHeading: 'Qué hace',
  features: {
    lan: {
      title: 'Control desde el celular por LAN',
      body: 'Abrí el panel en el celular y manejá la PC por la red local, sin cuentas ni servidores intermedios.',
    },
    obs: {
      title: 'Integración con OBS (WebSocket v5)',
      body: 'Cambiá de escena, iniciá la transmisión o silenciá fuentes con un toque, usando el protocolo oficial v5.',
    },
    emoji: {
      title: 'Lluvia de emojis en el overlay',
      body: 'Lanzá una lluvia de emojis sobre el stream como reacción en vivo, con un overlay liviano.',
    },
    soundboard: {
      title: 'Soundboard',
      body: 'Disparadores de sonido organizados en botones, listos para usar durante la transmisión.',
    },
    pc: {
      title: 'Control de PC y monitores',
      body: 'Volumen, brillo, apagado de pantallas y otras acciones del sistema desde el mismo panel.',
    },
    setups: {
      title: 'Setups multi-acción y carpetas anidadas',
      body: 'Encadená varias acciones en un solo botón y ordená todo en carpetas dentro de carpetas.',
    },
  },
  downloadHeading: 'Descarga',
  detectedOs: 'Sistema detectado',
  os: { windows: 'Windows', mac: 'macOS', linux: 'Linux', other: 'otro sistema' },
  windowsOnly:
    'Los instaladores actuales son solo para Windows. Tu sistema no está soportado por ahora.',
  installerMsi: 'Instalador .msi (recomendado)',
  installerExe: 'Instalador .exe',
  installerMsiTooltip:
    'Paquete de Windows Installer: ideal para instalar y desinstalar de forma limpia.',
  installerExeTooltip: 'Instalador clásico con asistente. Alternativa si el .msi no te funciona.',
  downloadPrivate: 'Disponible al terminar la prueba privada',
  downloadPrivateTooltip:
    'Todavía no hay instaladores públicos. Este botón se activa cuando se publique una versión.',
  versionLabel: 'Versión',
  versionTooltip: 'Elegí una versión para ver sus notas de lanzamiento.',
  notesHeading: 'Notas de la versión',
  releaseDate: 'Publicada el',
  noDate: 'Sin fecha de publicación (prueba privada)',
  hubTitle: 'DeusDeck Hub',
  hubBody:
    'Temas, íconos vectoriales, emojis animados y plugins de la comunidad, pensados para instalarse desde la app.',
  hubLink: 'Abrir el Hub',
  hubTooltip: 'Abre la galería de recursos comunitarios de DeusDeck.',
  legalHeading: 'Legal y licencia',
  legalEula: 'EULA: licencia de uso y cláusula AS-IS',
  legalPrivacy: 'Política de privacidad',
  legalTerms: 'Términos y condiciones del sitio',
  legalEulaTooltip:
    'Acuerdo de licencia de usuario final, incluida la cláusula «tal cual» (AS-IS).',
  legalPrivacyTooltip: 'Cómo se tratan los datos en este sitio y en la app.',
  legalTermsTooltip: 'Condiciones de uso de este sitio.',
  legalNote:
    'Los documentos son borradores pendientes de revisión legal. Al instalar el programa aceptás el EULA.',
  eulaTitle: 'EULA de DeusDeck',
  eulaIntro:
    'Acuerdo de licencia de usuario final de DeusDeck. Se entrega «tal cual» (AS-IS), sin garantías de ningún tipo.',
  backToDeck: 'Volver a DeusDeck',
};

export const deckEn: typeof deckEs = {
  badge: 'Private beta',
  programsLabel: 'Programs',
  lead: 'Your control panel for the PC, the stream and the desktop, driven from your phone over the local network.',
  statusTitle: 'Status: private beta',
  statusBody:
    'DeusDeck is in closed testing. Installers are not public yet and this site distributes no binaries until that stage ends.',
  featuresHeading: 'What it does',
  features: {
    lan: {
      title: 'Phone control over LAN',
      body: 'Open the panel on your phone and drive the PC over the local network, with no accounts or middle servers.',
    },
    obs: {
      title: 'OBS integration (WebSocket v5)',
      body: 'Switch scenes, start streaming or mute sources with one tap, using the official v5 protocol.',
    },
    emoji: {
      title: 'Emoji rain overlay',
      body: 'Trigger a rain of emojis over the stream as a live reaction, with a lightweight overlay.',
    },
    soundboard: {
      title: 'Soundboard',
      body: 'Sound triggers laid out as buttons, ready to use during the stream.',
    },
    pc: {
      title: 'PC and monitor control',
      body: 'Volume, brightness, turning displays off and other system actions from the same panel.',
    },
    setups: {
      title: 'Multi-action setups and nested folders',
      body: 'Chain several actions into one button and organize everything in folders within folders.',
    },
  },
  downloadHeading: 'Download',
  detectedOs: 'Detected system',
  os: { windows: 'Windows', mac: 'macOS', linux: 'Linux', other: 'another system' },
  windowsOnly: 'Current installers are for Windows only. Your system is not supported yet.',
  installerMsi: '.msi installer (recommended)',
  installerExe: '.exe installer',
  installerMsiTooltip: 'Windows Installer package: best for a clean install and uninstall.',
  installerExeTooltip: 'Classic installer with a wizard. An alternative if the .msi does not work.',
  downloadPrivate: 'Available when the private beta ends',
  downloadPrivateTooltip:
    'There are no public installers yet. This button turns on when a version is published.',
  versionLabel: 'Version',
  versionTooltip: 'Pick a version to read its release notes.',
  notesHeading: 'Release notes',
  releaseDate: 'Published on',
  noDate: 'No publication date (private beta)',
  hubTitle: 'DeusDeck Hub',
  hubBody:
    'Community themes, vector icons, animated emojis and plugins, designed to be installed from the app.',
  hubLink: 'Open the Hub',
  hubTooltip: 'Opens the DeusDeck community resource gallery.',
  legalHeading: 'Legal and license',
  legalEula: 'EULA: usage license and AS-IS clause',
  legalPrivacy: 'Privacy policy',
  legalTerms: 'Site terms and conditions',
  legalEulaTooltip: 'End user license agreement, including the "as is" (AS-IS) clause.',
  legalPrivacyTooltip: 'How data is handled on this site and in the app.',
  legalTermsTooltip: 'Terms of use of this site.',
  legalNote:
    'These documents are drafts pending legal review. By installing the program you accept the EULA.',
  eulaTitle: 'DeusDeck EULA',
  eulaIntro:
    'DeusDeck end user license agreement. It is provided "as is" (AS-IS), without warranty of any kind.',
  backToDeck: 'Back to DeusDeck',
};

export const hubEs = {
  title: 'DeusDeck Hub',
  lead: 'Recursos de la comunidad para DeusDeck. La app de escritorio abre esta página para que instales temas, íconos, emojis y plugins.',
  searchLabel: 'Buscar recursos',
  searchPlaceholder: 'Buscá por nombre, autor o descripción',
  searchTooltip: 'Filtra la galería mientras escribís.',
  categoryLabel: 'Categoría',
  categories: {
    all: 'Todo',
    themes: 'Temas',
    icons: 'Íconos vectoriales',
    emoji: 'Emojis animados',
    plugins: 'Plugins',
  },
  categoryTooltip: 'Mostrar solo esta categoría.',
  count: '{n} recursos',
  loading: 'Cargando recursos…',
  loadError: 'No se pudo cargar el catálogo. Intentá de nuevo en un momento.',
  emptyTitle: 'Todavía no hay recursos publicados',
  emptyBody:
    'El Hub se abre junto con la versión pública de DeusDeck. Acá aparecerán los recursos de la comunidad cuando existan.',
  noResults: 'Ningún recurso coincide con tu búsqueda.',
  more: 'Mostrar más',
  moreTooltip: 'Agrega los siguientes recursos a la lista sin recargar la página.',
  by: 'Por',
  version: 'Versión',
  compat: 'Compatible con DeusDeck {v} o superior',
  compatTooltip: 'Versión mínima de DeusDeck necesaria para usar este recurso.',
  details: 'Ver detalles',
  detailsTooltip: 'Abre la vista previa y la descripción completa.',
  close: 'Cerrar',
  download: 'Descargar',
  downloadTooltip: 'Descarga directa del recurso.',
  install: 'Instalar en DeusDeck',
  installTooltip: 'Abre la app de DeusDeck para instalar este recurso (requiere la app instalada).',
  noPreview: 'Sin vista previa',
  previewAlt: 'Vista previa de {name}',
};

export const hubEn: typeof hubEs = {
  title: 'DeusDeck Hub',
  lead: 'Community resources for DeusDeck. The desktop app opens this page so you can install themes, icons, emojis and plugins.',
  searchLabel: 'Search resources',
  searchPlaceholder: 'Search by name, author or description',
  searchTooltip: 'Filters the gallery as you type.',
  categoryLabel: 'Category',
  categories: {
    all: 'All',
    themes: 'Themes',
    icons: 'Vector icons',
    emoji: 'Animated emojis',
    plugins: 'Plugins',
  },
  categoryTooltip: 'Show only this category.',
  count: '{n} resources',
  loading: 'Loading resources…',
  loadError: 'The catalog could not be loaded. Try again in a moment.',
  emptyTitle: 'No resources published yet',
  emptyBody:
    'The Hub opens together with the public DeusDeck release. Community resources will show up here once they exist.',
  noResults: 'No resource matches your search.',
  more: 'Show more',
  moreTooltip: 'Adds the next resources to the list without reloading the page.',
  by: 'By',
  version: 'Version',
  compat: 'Compatible with DeusDeck {v} or later',
  compatTooltip: 'Minimum DeusDeck version needed to use this resource.',
  details: 'View details',
  detailsTooltip: 'Opens the preview and the full description.',
  close: 'Close',
  download: 'Download',
  downloadTooltip: 'Direct download of the resource.',
  install: 'Install in DeusDeck',
  installTooltip: 'Opens the DeusDeck app to install this resource (requires the app installed).',
  noPreview: 'No preview',
  previewAlt: 'Preview of {name}',
};
