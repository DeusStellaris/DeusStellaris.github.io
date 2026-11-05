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
    search: 'Search',
    ranking: 'Ranking',
    profile: 'Profile',
    primaryLabel: 'Main navigation',
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
  projects: {
    latestHeading: 'Latest projects',
    emptyHome: 'No projects have been published yet. Check back soon.',
    emptySection: 'No projects have been published in this section yet.',
    viewProject: 'View project',
    published: 'Published',
    updated: 'Updated',
    featured: 'Featured',
    collaborators: 'Collaborators',
    gallery: 'Gallery',
    externalLinks: 'Links',
    backToSection: 'Back to',
    fallbackNotice: 'This version of the project is only available in Spanish.',
    category: 'Category',
  },
  preferences: {
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    liteMode: 'Performance mode',
    liteModeHint: 'Reduces animations and visual effects',
  },
  search: {
    heading: 'Search',
    label: 'Search text',
    placeholder: 'Search projects, games, programs or services',
    filterLabel: 'Filter by section',
    filterAll: 'All sections',
    loading: 'Loading search…',
    error: 'Search could not be loaded. Check your connection and try again.',
    retry: 'Try again',
    hint: 'Type at least two letters to search.',
    noResults: 'No results found for “{query}”.',
    resultsCount: '{count} results',
    typeSection: 'Section',
    typeProject: 'Project',
    clear: 'Clear search',
  },
  assistant: {
    open: 'Open search assistant',
    close: 'Close assistant',
    title: 'Search assistant',
    intro: 'Search by name, description or category. It only searches the content of this site.',
    contextHint: 'Results from this section appear first.',
  },
  favorites: {
    add: 'Add to favorites',
    remove: 'Remove from favorites',
    added: 'Added to favorites',
    removed: 'Removed from favorites',
    unavailable:
      'This browser does not allow saving favorites. They will be lost when the page reloads.',
  },
  profile: {
    open: 'Local profile',
    title: 'Your local profile',
    privacy:
      'This profile is anonymous and is stored only in this browser. There is no account and no data is sent to a server.',
    favoritesHeading: 'Favorites',
    noFavorites: 'You have not marked any projects as favorites yet.',
    preferencesHeading: 'Preferences',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    liteLabel: 'Performance mode',
    on: 'On',
    off: 'Off',
    close: 'Close',
    remove: 'Remove',
    clearAll: 'Clear favorites',
  },
  likes: {
    like: 'Like',
    liked: 'Liked',
    count: '{count} likes',
    error: 'Your like could not be registered. Try again later.',
    unconfigured: 'Likes are not available yet.',
  },
  ranking: {
    heading: 'Project ranking',
    intro: 'The projects with the most likes across the portfolio.',
    filterLabel: 'Filter by category',
    filterAll: 'All categories',
    loading: 'Loading ranking…',
    error: 'The ranking could not be loaded. Try again later.',
    unconfigured: 'The ranking is not available yet.',
    empty: 'No likes have been registered yet.',
    position: 'Rank',
  },
  comments: {
    heading: 'Comments',
    disabled: 'Comments are not active yet.',
    load: 'Load comments',
    loadError: 'Comments could not be loaded. You can try again later.',
  },
  notFound: {
    title: 'Page not found',
    body: 'The address you are looking for does not exist or has moved.',
    back: 'Back to home',
  },
};

export default en;
