#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const siteUrl = (process.env.SITE_URL || 'https://dt.cfgames.site').replace(
  /\/$/,
  ''
);
const publicDir = path.join(__dirname, '..', 'public');
const configPath = path.join(__dirname, '..', 'src', 'app', 'config', 'config.ts');
const seoConfigPath = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'config',
  'seo.config.ts'
);

function readArchiveEventShortNames() {
  const source = fs.readFileSync(configPath, 'utf8');
  const blockMatch = source.match(
    /archiveEventShortNames:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/
  );
  if (!blockMatch) {
    return [];
  }
  return [...blockMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function readStaticPaths() {
  const source = fs.readFileSync(seoConfigPath, 'utf8');
  const blockMatch = source.match(
    /SEO_SITEMAP_STATIC_PATHS\s*=\s*\[([\s\S]*?)\]\s*as const/
  );
  if (!blockMatch) {
    throw new Error('Could not parse SEO_SITEMAP_STATIC_PATHS from seo.config.ts');
  }
  return [...blockMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const staticPaths = readStaticPaths();
const archiveEvents = readArchiveEventShortNames();
const archivePaths = archiveEvents.flatMap((event) => [
  `/wods/${event}`,
  `/teams/${event}`,
  `/leaderboard/${event}`,
]);

const paths = [...new Set([...staticPaths, ...archivePaths])];

const urls = paths
  .map(
    (p) =>
      `  <url>\n    <loc>${siteUrl}${p}</loc>\n  </url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
console.log(`Wrote sitemap.xml with ${paths.length} URLs (${siteUrl})`);
