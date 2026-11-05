import type { Dictionary } from './es';

// Diccionario de interfaz en inglés.
// Es parcial a propósito: las claves que falten caen al español en `index.ts`,
// así que nunca se muestran cadenas vacías ni claves internas.
// TRADUCCIÓN PENDIENTE DE REVISIÓN por el titular del sitio.

const en: Partial<Dictionary> = {
  common: {
    skipToContent: 'Skip to content',
    siteName: 'Deus',
    languageSwitchLabel: 'Language',
  },
  nav: {
    home: 'Home',
    games: 'Games',
    programs: 'Programs',
    freelance: 'Freelance',
    contact: 'Contact',
    primaryLabel: 'Main navigation',
  },
  pending: {
    notice: 'Content in preparation. It will be published from the admin panel.',
  },
  sections: {
    home: {
      title: 'Deus',
      subtitle: 'Technical environments, content creation and custom development.',
      exploreHeading: 'Explore the sections',
    },
    games: {
      title: 'Games',
      intro: 'Video game projects: custom environments, modeling and development.',
    },
    programs: {
      title: 'Programs',
      intro: 'Tools, software and programming projects.',
    },
    freelance: {
      title: 'Freelance',
      intro: 'Professional development and technical design services.',
    },
    contact: {
      title: 'Contact',
      intro: 'You can write to me by email or find me on my social networks.',
      noLinks: 'Contact details will be published soon.',
    },
  },
  preferences: {
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    liteMode: 'Performance mode',
    liteModeHint: 'Reduces animations and visual effects',
  },
  notFound: {
    title: 'Page not found',
    body: 'The address you are looking for does not exist or has moved.',
    back: 'Back to home',
  },
};

export default en;
