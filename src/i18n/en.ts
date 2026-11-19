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
  intro: {
    welcome: 'Welcome',
  },
  preferences: {
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    liteMode: 'Performance mode',
    liteModeHint:
      'Lite Mode is on by default to save CPU, GPU, RAM and battery. Press it to turn on the full ambient effects; press again to save resources.',
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
  legal: {
    draftNotice:
      'PENDING LEGAL REVIEW — NON-FINAL DRAFT (PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO)',
    version: 'Version',
    footerTerms: 'Terms',
    footerPrivacy: 'Privacy',
    footerCookies: 'Cookies',
    footerRefund: 'Refunds',
    dataDeletionRequest: 'Request data deletion / Cancel subscription',
    pendingTag: 'Pending item',
  },
  consent: {
    title: 'Terms, privacy and cookies',
    intro:
      'Before using features that store data or connect to services, please review and accept the documents. Optional choices are independent.',
    termsLabel: 'I have read and accept the Terms and conditions of use',
    privacyLabel: 'I have read and accept the Privacy policy',
    adsLabel: 'I accept non-essential advertising when it is active (optional)',
    required: 'To continue, check the two required documents.',
    submit: 'Save my choices',
    later: 'Later',
    optionalLabel: 'Optional cookies (not needed to use the site):',
    optionalAccept: 'Accept optional cookies',
    optionalReject: 'Reject optional',
    docsLabel: 'Legal documents',
    tooltipTerms: 'Opens the Terms and conditions of use.',
    tooltipPrivacy: 'Opens the Privacy policy.',
    tooltipCookies: 'Opens the Cookie policy.',
    tooltipSubmit: 'Saves your acceptance of the ticked documents.',
    tooltipReject: 'Rejects optional storage and cookies. The site works just the same.',
    tooltipLater: 'Closes this notice until the next session without saving anything.',
    tooltipAccept: 'Accepts optional cookies (non-essential advertising).',
    close: 'Close',
    registered: 'Acceptance registered on the server.',
    serverPending:
      'We could not register your acceptance on the server. You can try again later. The site does not treat it as registered.',
    serverUnavailable:
      'Acceptance registration is not available yet. The site does not treat it as registered.',
    localSaved: 'Your cookie choices were saved in this browser.',
    open: 'Review consents',
    manageTitle: 'Cookie preferences',
    manageIntro: 'You can change these choices at any time.',
    adsDisabled: 'There is currently no active advertising on the site.',
    statusRegistered: 'Registered',
    statusPending: 'Pending registration',
  },
  ads: {
    placeholder: 'Advertising space',
    waiting: 'Advertising will only be shown if you accept the advertising preference.',
  },
  offline: {
    title: 'Offline',
    body: 'There is no connection and this page has not been saved on your device yet. Try again when you are back online.',
    back: 'Go to home',
  },
  push: {
    open: 'Notifications',
    openHint: 'Choose which alerts you want to receive. They only turn on if you decide so.',
    title: 'Notification preferences',
    close: 'Close',
    intro:
      'Choose what you want to receive. Alerts only reach this device and you can change or turn them off at any time.',
    modeGroup: 'Which alerts to receive',
    categoriesGroup: 'Categories',
    projectsGroup: 'Specific projects',
    impactTitle: 'Estimated impact',
    impactBattery: 'Battery',
    impactData: 'Background data',
    detailHint: 'Hover or focus an option to see its details.',
    categoryTooltip: 'Receive alerts from this section.',
    projectTooltip: 'Receive alerts from this project.',
    enable: 'Enable on this device',
    enableHint: 'Asks the browser for permission to show alerts on this device.',
    modes: {
      all: {
        label: 'Everything',
        tooltip: 'Get an alert for every update on the site.',
        description:
          'One alert for every published update, whatever the section. The most complete option.',
        battery: 'Low: each alert wakes the device for a few seconds.',
        data: 'About 1 to 2 KB per alert, a few per week.',
      },
      none: {
        label: 'Nothing',
        tooltip: 'Receive no alerts and cancel this device subscription.',
        description:
          'No alerts at all. This device subscription is cancelled and removed from the server.',
        battery: 'None.',
        data: 'None.',
      },
      categories: {
        label: 'By category',
        tooltip: 'Pick one or more sections: Games, Programs or Freelance.',
        description:
          'You only get alerts from the sections you tick: Games, Programs or Freelance.',
        battery: 'Very low: fewer alerts than Everything.',
        data: 'Under 1 KB per week, depending on your choice.',
      },
      projects: {
        label: 'By project',
        tooltip: 'Follow specific projects, for example DeusDeck.',
        description:
          'You only get alerts from the projects you follow, such as DeusDeck. The quietest option.',
        battery: 'Minimal: only alerts for what you follow.',
        data: 'Minimal: a few KB per month.',
      },
    },
    status: {
      off: 'Notifications are off on this device.',
      needsPermission:
        'Your preferences are saved. Notifications still need to be enabled on this device.',
      active: 'Active on this device. Changes are saved automatically.',
      denied:
        'The browser blocked notifications. Allow them in the site permissions to turn them on.',
      unsupported: 'This browser does not support push notifications.',
      unconfigured:
        'Preferences saved on this device. Alerts will turn on once the notification service is available.',
      saving: 'Saving…',
      error: 'The action could not be completed. Please try again later.',
    },
    ios: 'On iPhone and iPad you must install the app first: tap Share, choose "Add to Home Screen" and open it from its icon. Then you can enable notifications.',
  },
  notFound: {
    title: 'Page not found',
    body: 'The address you are looking for does not exist or has moved.',
    back: 'Back to home',
  },
};

export default en;
