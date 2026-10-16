import { appConfig } from './config';

/** Venue and brand copy used in meta tags, JSON-LD, and on-page SEO text. */
export const SEO_VENUE = {
  name: 'CrossFit Monkey Flag',
  url: 'https://monkeyflagfitness.com/',
  streetAddress: 'Futsal 5, Centro Mall, opposite Garware College',
  addressLocality: 'Pune',
  addressRegion: 'Maharashtra',
  postalCode: '411004',
  addressCountry: 'IN',
  telephone: '+91 9767755419',
};

export const SEO_ORGANIZER = {
  name: 'Deccan Throwdown',
  sameAs: ['https://www.instagram.com/deccanthrowdown'],
};

/** Shared homepage title and description. Keep index.html in sync. */
export const SEO_HOME = {
  title: 'Deccan Throwdown — CrossFit Competition in Pune',
  description:
    'Deccan Throwdown is a CrossFit competition in Pune at CrossFit Monkey Flag, Futsal 5, Centro Mall. Register your team, view WODs, and follow the live leaderboard.',
};

export const SEO_DEFAULT_KEYWORDS = [
  'Deccan Throwdown',
  'CrossFit Pune',
  'CrossFit competition in Pune',
  'CrossFit Monkey Flag',
  'CrossFit',
  'team CrossFit',
  'functional fitness',
].join(', ');

export interface SeoRouteData {
  title: string;
  description: string;
}

/** Paths included in sitemap.xml (no trailing slash). */
export const SEO_SITEMAP_STATIC_PATHS = [
  '/',
  '/wods',
  '/teams',
  '/leaderboard',
  '/pics',
  '/learn',
  '/register',
] as const;

export function eventIsoDateRange(
  eventShortName: string,
  eventDates: string
): { startDate: string; endDate: string } {
  if (eventShortName === 'dtteams2026') {
    return { startDate: '2026-11-28', endDate: '2026-11-29' };
  }
  if (eventShortName === 'dtteams2025') {
    return { startDate: '2025-11-01', endDate: '2025-11-02' };
  }
  if (eventShortName === 'dtpairs2025') {
    return { startDate: '2025-01-01', endDate: '2025-12-31' };
  }
  const yearMatch = eventDates.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2026';
  return { startDate: `${year}-01-01`, endDate: `${year}-01-01` };
}

const ARCHIVE_SECTION_LABELS = {
  wods: 'WODs',
  teams: 'Teams',
  leaderboard: 'Leaderboard',
} as const;

/**
 * Archive URLs share a parent route's static SEO data. Derive a title and
 * description from the event so /wods/dtteams2025 is not a duplicate of /wods.
 */
export function seoForPublicPath(
  path: string,
  routeSeo?: SeoRouteData
): SeoRouteData | undefined {
  const match = path.match(/^\/(wods|teams|leaderboard)\/([a-z0-9]+)$/);
  if (!match) {
    return routeSeo;
  }
  const section = match[1] as keyof typeof ARCHIVE_SECTION_LABELS;
  const event = appConfig[match[2]];
  if (!event) {
    return routeSeo;
  }
  const label = ARCHIVE_SECTION_LABELS[section];
  const place = `${SEO_VENUE.name} in ${SEO_VENUE.addressLocality}`;
  return {
    title: `${label} — ${event.eventName}`,
    description: `${label} for ${event.eventName} (${event.eventDates}), a CrossFit competition at ${place}.`,
  };
}

export function buildSportsEventJsonLd(options: {
  siteUrl: string;
  eventShortName: string;
  eventName: string;
  eventDates: string;
  description: string;
  price: number;
  registrationStatus: 'open' | 'closed' | 'coming-soon';
}): Record<string, unknown> {
  const site = options.siteUrl.replace(/\/$/, '');
  const dates = eventIsoDateRange(options.eventShortName, options.eventDates);
  const availability =
    options.registrationStatus === 'open'
      ? 'https://schema.org/InStock'
      : options.registrationStatus === 'coming-soon'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/SoldOut';

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: options.eventName,
    description: options.description,
    sport: 'CrossFit',
    startDate: dates.startDate,
    endDate: dates.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${site}/`,
    image: `${site}/icons/logo_512.jpg`,
    location: {
      '@type': 'Place',
      name: SEO_VENUE.name,
      url: SEO_VENUE.url,
      telephone: SEO_VENUE.telephone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SEO_VENUE.streetAddress,
        addressLocality: SEO_VENUE.addressLocality,
        addressRegion: SEO_VENUE.addressRegion,
        postalCode: SEO_VENUE.postalCode,
        addressCountry: SEO_VENUE.addressCountry,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: SEO_ORGANIZER.name,
      url: `${site}/`,
      sameAs: SEO_ORGANIZER.sameAs,
    },
    offers: {
      '@type': 'Offer',
      url: `${site}/register`,
      price: String(options.price),
      priceCurrency: 'INR',
      availability,
    },
  };
}
