#!/usr/bin/env node
// Runs after `astro build`:
// 1. dist/_redirects (Cloudflare Pages / Netlify format) from content/redirects.json,
//    plus automatic 301s for folder roots that are not pages under the URL standard
//    (/austin/ -> /austin/appliance-repair/, /travis-county/ -> its county page).
// 2. dist/<INDEXNOW_KEY>.txt when the INDEXNOW_KEY env var is set (IndexNow key file).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, livePages } from '../src/lib/content.mjs';
import { routes } from '../src/lib/routes.mjs';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const { cities, counties, useCountyPages, site, services, umbrellaSlug } = loadContent();
const livePaths = new Set(livePages().map((p) => p.path));

const manual = existsSync(join(ROOT, 'content', 'redirects.json'))
  ? JSON.parse(readFileSync(join(ROOT, 'content', 'redirects.json'), 'utf8')).filter((r) => r.from)
  : [];
const auto = [];
for (const c of cities) {
  const to = routes.city(c.slug);
  if (livePaths.has(to) && !livePaths.has(`/${c.slug}/`)) auto.push({ from: `/${c.slug}/`, to, status: 301 });
}
// The target city has no city or city service pages (the home page and main service pages
// serve it): its folder, city page and city service URLs 301 to them.
const target = site.targetCityPages ? null : cities.find((c) => c.name === site.targetCity);
if (target) {
  auto.push({ from: `/${target.slug}/`, to: routes.home(), status: 301 });
  auto.push({ from: routes.city(target.slug), to: routes.home(), status: 301 });
  for (const s of services) if (livePaths.has(routes.service(s.slug))) auto.push({ from: routes.cityService(target.slug, s.slug), to: routes.service(s.slug), status: 301 });
}
if (useCountyPages) {
  for (const c of counties) {
    const to = routes.county(c.slug);
    if (livePaths.has(to) && !livePaths.has(`/${c.slug}/`)) auto.push({ from: `/${c.slug}/`, to, status: 301 });
  }
}
const seen = new Set(manual.map((r) => r.from));
const rules = [...manual, ...auto.filter((r) => !seen.has(r.from))];
writeFileSync(join(DIST, '_redirects'), rules.map((r) => `${r.from} ${r.to} ${r.status ?? 301}`).join('\n') + (rules.length ? '\n' : ''));
console.log(`Redirects: ${manual.length} manual + ${auto.length} automatic folder redirects written to dist/_redirects`);

const key = process.env.INDEXNOW_KEY;
if (key) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
    console.error('INDEXNOW_KEY must be 8 to 128 letters, digits or dashes.');
    process.exit(1);
  }
  writeFileSync(join(DIST, `${key}.txt`), key);
  console.log('IndexNow: key file written.');
}
