/** Venue and brand copy used in meta tags, JSON-LD, and on-page SEO text. */
export const SEO_VENUE = {
  name: 'CrossFit Monkey Flag',
  addressLocality: 'Pune',
  addressRegion: 'Maharashtra',
  addressCountry: 'IN',
};

export const SEO_DEFAULT_KEYWORDS = [
  'CrossFit',
  'Deccan Throwdown',
  'CrossFit Monkey Flag',
  'CrossFit competition',
  'team CrossFit',
  'functional fitness',
  'Pune CrossFit',
].join(', ');

export interface SeoRouteData {
  title: string;
  description: string;
}

/** Paths included in sitemap.xml (no trailing slash). */
export const SEO_SITEMAP_STATIC_PATHS = [
  '/home',
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
