#!/usr/bin/env node
// Gate step 1: checks /content BEFORE building. Fast feedback on structure, URL
// standard, keyword map, house style, compliance and fact consistency, then a
// coverage report of planned pages that still have no copy. Run: npm run validate

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadContent, blogTypes } from '../src/lib/content.mjs';
import { RESERVED_ROOT_SLUGS } from '../src/lib/routes.mjs';

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

let data;
try {
  data = loadContent();
} catch (e) {
  console.error(`\n✖ ${e.message}\n`);
  process.exit(1);
}
const { site, services, counties, cities, brands, authors, keywords, reviews, pages, useCountyPages } = data;
const rel = (p) => (p ? relative(ROOT, p) : '');

// ---------- site.json ----------
for (const f of ['name', 'url', 'phone', 'phoneE164', 'email', 'umbrellaKeyword', 'targetCity', 'summary']) if (!site[f]) err('site.json', `"${f}" is required`);
if (site.url && !/^https:\/\/[^/]+$/.test(site.url)) err('site.json', `"url" must be https://domain with no trailing slash (got ${site.url})`);
if (site.phoneE164 && !/^\+\d{8,15}$/.test(site.phoneE164)) err('site.json', '"phoneE164" must look like +15125550142');
if (site.phone && site.phoneE164 && site.phone.replace(/\D/g, '').slice(-10) !== site.phoneE164.replace(/\D/g, '').slice(-10)) err('site.json', '"phone" and "phoneE164" are different numbers (NAP must match the GBP)');
for (const f of ['street', 'city', 'region', 'postalCode', 'country']) if (!site.address?.[f]) err('site.json', `address.${f} is required (complete NAP, identical to the GBP)`);
if (!site.schema?.types?.length) err('site.json', 'schema.types is required, e.g. ["LocalBusiness", "HomeAndConstructionBusiness"]');
if (!site.schema?.additionalType?.length) warn('site.json', 'schema.additionalType is empty (IZY standard: Wikipedia + Productontology URLs)');
if (site.targetCity && !cities.some((c) => c.name === site.targetCity)) err('site.json', `targetCity "${site.targetCity}" is not a city in locations.json`);
// The target city is served by the home page and the main service pages; its own city and
// city service pages would compete with them for the same searches (Artem 31 Oct 2026).
{
  const t = site.targetCityPages ? null : cities.find((c) => c.name === site.targetCity);
  if (t) {
    if (existsSync(join(ROOT, 'content', 'pages', 'cities', `${t.slug}.json`))) err(`content/pages/cities/${t.slug}.json`, `${t.name} is the target city: the home page serves it. Move anything unique into home.json and delete this file (its URL redirects to the home page)`);
    const dir = join(ROOT, 'content', 'pages', 'city-services', t.slug);
    if (existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.json'))) err(`content/pages/city-services/${t.slug}/`, `${t.name} is the target city: each main service page serves it. Move anything unique into content/pages/services/<service>.json and delete these files (their URLs redirect to the main service pages)`);
  }
}
if (!site.stats?.length) err('site.json', 'stats is empty: the numbers section after the hero is standard on every money page');
if (!site.offers?.length) err('site.json', 'offers is empty: the promotion and offer block is standard (build it from standing offers and merits if there is no promotion)');
if (!site.gbpUrl) warn('site.json', 'gbpUrl is empty: the Google Business Profile URL ties the site to the GBP entity (sameAs / hasMap)');
if (!site.competitors?.length) warn('site.json', 'competitors is empty: blog outbound links cannot be checked against the competitor list');
if (!site.fixedFacts?.warranty) warn('site.json', 'fixedFacts.warranty is empty: state each fact one way everywhere (AEO consistency)');
if (site.aiCrawlers && !['allow', 'block-training'].includes(site.aiCrawlers)) err('site.json', 'aiCrawlers must be "allow" or "block-training"');

// ---------- slugs and the URL standard ----------
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const extraSlugs = pages.filter((p) => p.type === 'page').map((p) => p.slug);
const roots = [
  ...services.map((s) => ['service', s.slug]),
  ...brands.map((b) => ['brand', b.slug]),
  ...extraSlugs.map((s) => ['page', s]),
  ...cities.map((c) => ['city', c.slug]),
  ...(useCountyPages ? counties.map((c) => ['county', c.slug]) : []),
];
const seen = new Map();
for (const [kind, slug] of roots) {
  if (!SLUG.test(slug ?? '')) err(`${kind} slug`, `"${slug}" is not lowercase-kebab`);
  if (RESERVED_ROOT_SLUGS.includes(slug)) err(`${kind} slug`, `"${slug}" is reserved by a hub or core page`);
  if (seen.has(slug)) err(`${kind} slug`, `"${slug}" is used twice at the root (${seen.get(slug)} and ${kind}); every root URL must be unique`);
  seen.set(slug, kind);
}
for (const s of services) {
  if (/(^|-)services?$/.test(s.slug) && !keywords[`/${s.slug}/`]?.primary?.toLowerCase().includes('service')) err('services.json', `slug "${s.slug}": the slug is the keyword as searched, never "-services" (URL standard)`);
  if (!s.additionalType?.length) warn('services.json', `"${s.slug}" has no additionalType`);
}
for (const c of cities) if (/-(tx|ca|fl|ny|[a-z]{2})$/.test(c.slug) && c.slug.split('-').pop().length === 2) warn('locations.json', `city slug "${c.slug}" looks like it has a state suffix (URL standard: city name only)`);

// ---------- live page copy ----------
const live = pages.filter((p) => p.live);
const need = (p, path, label) => {
  const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), p.copy);
  if (v == null || (Array.isArray(v) && !v.length) || v === '') err(rel(p.copyFile), `${label ?? path} is required for a ${p.type} page`);
  return v;
};
const REQUIRED = {
  home: ['meta.description', 'hero.h1', 'hero.overview', 'servicesBlock.h2', 'areasBlock.h2', 'faq', 'closing'],
  'services-hub': ['meta.description', 'hero.h1', 'servicesBlock.h2', 'locationsBlock.h2', 'faq', 'closing'],
  'areas-hub': ['meta.description', 'hero.h1', 'servicesBlock.h2', 'locationsBlock.h2', 'faq', 'closing'],
  service: ['meta.description', 'hero.overview', 'hero.sellingPoints', 'serviceBlock.cards', 'process.steps', 'whyChoose.cards', 'faq', 'faqClosing', 'closing'],
  county: ['meta.description', 'hero.overview', 'hero.sellingPoints', 'areasBlock.h2', 'servicesBlock.h2', 'whyChoose.cards', 'faq', 'closing'],
  city: ['meta.description', 'hero.overview', 'hero.sellingPoints', 'servicesBlock.h2', 'whyChoose.cards', 'faq', 'closing'],
  'city-service': ['meta.description', 'hero.overview', 'hero.sellingPoints', 'problems.cards', 'whyChoose.cards', 'faq', 'closing'],
  brand: ['meta.description', 'hero.h1', 'hero.overview', 'serviceBlock.cards', 'process.steps', 'whyChoose.cards', 'faq', 'closing'],
  'brands-hub': ['meta.description', 'hero.h1', 'brandsBlock.h2'],
  about: ['meta.description', 'hero.h1'],
  faq: ['meta.description', 'hero.h1', 'groups'],
  reviews: ['meta.description', 'hero.h1'],
  contact: ['meta.description', 'hero.h1'],
  'blog-hub': ['meta.description', 'hero.h1'],
  page: ['meta.description', 'hero.h1'],
};
const ZIP = /\b\d{5}(?:-\d{4})?\b/;
const names = site.compliance?.personNames ?? [];
const banned = (site.compliance?.bannedPhrases ?? []).map((b) => b.toLowerCase());

// Article type for the blog hub filters: one of blogTypes() (agency default plus site.blog.types).
const ARTICLE_TYPES = blogTypes();
function checkArticleType(where, type) {
  if (!type) warn(where, `no article "type": the blog hub cannot filter it by type (one of: ${Object.keys(ARTICLE_TYPES).join(', ')})`);
  else if (!ARTICLE_TYPES[type]) err(where, `article type "${type}" is not one of: ${Object.keys(ARTICLE_TYPES).join(', ')} (add new ones to site.blog.types)`);
}

for (const p of live) {
  const where = rel(p.copyFile);
  if (p.type === 'blog-post') {
    const c = p.copy;
    for (const f of ['title', 'metaTitle', 'metaDescription', 'date', 'author', 'targetKeyword']) if (!c[f]) err(where, `frontmatter "${f}" is required`);
    if (c.metaTitle && (c.metaTitle.length < 50 || c.metaTitle.length > 60)) err(where, `metaTitle is ${c.metaTitle.length} chars (blog SOP: 50 to 60)`);
    if (c.metaDescription && (c.metaDescription.length < 150 || c.metaDescription.length > 160)) err(where, `metaDescription is ${c.metaDescription.length} chars (blog SOP: 150 to 160)`);
    if (c.author && !authors.find((a) => a.slug === c.author)) err(where, `author "${c.author}" is not in authors.json (GEO: a named person with a role, not "the team")`);
    if (c.targetKeyword && !c.title.toLowerCase().includes(c.targetKeyword.toLowerCase().split(' ')[0])) warn(where, 'the H1 (title) should contain the target keyword');
    for (const s of c.services ?? []) if (!services.find((x) => x.slug === s)) err(where, `services tag "${s}" is not in services.json`);
    for (const ci of c.cities ?? []) if (!cities.find((x) => x.slug === ci)) err(where, `cities tag "${ci}" is not in locations.json`);
    checkArticleType(where, c.type);
    continue;
  }
  // Guides (extra pages with "guide": true) are listed and filtered on the blog hub like posts.
  if (p.type === 'page' && p.copy.guide) {
    for (const s of [].concat(p.copy.services ?? [])) if (!services.find((x) => x.slug === s)) err(where, `services tag "${s}" is not in services.json`);
    for (const ci of [].concat(p.copy.cities ?? [])) if (!cities.find((x) => x.slug === ci)) err(where, `cities tag "${ci}" is not in locations.json`);
    if (!p.copy.services?.length) warn(where, 'guide has no "services" tag: the blog hub cannot filter it by service');
    checkArticleType(where, p.copy.type);
  }
  for (const r of REQUIRED[p.type] ?? []) need(p, r);
  if (p.copy.hero?.sellingPoints && ['service', 'county', 'city', 'city-service'].includes(p.type) && p.copy.hero.sellingPoints.length !== 3) warn(where, 'hero should carry three selling points');
  if (['service', 'county', 'city', 'city-service'].includes(p.type) && p.copy.hero?.h1) err(where, `hero.h1 must not be set on a ${p.type} page: the H1 format is fixed by the agency standard and generated by the template`);
  if (!keywords[p.path]?.primary) err('content/keywords.json', `no primary keyword for live page ${p.path}`);
  if (!p.copy.updated) warn(where, '"updated" (YYYY-MM-DD) is missing: it feeds sitemap lastmod and dateModified');
  const heroText = JSON.stringify(p.copy.hero ?? {});
  if (ZIP.test(heroText)) err(where, 'ZIP code in the hero (agency rule: keyword in, ZIP codes out; ZIPs go in the services intro or FAQ)');
  for (const f of p.copy.faq ?? []) {
    if (!f.q || !f.a) err(where, 'every FAQ item needs "q" and "a"');
    else if (!f.q.trim().endsWith('?')) err(where, `FAQ question "${f.q}" must be a real question ending in "?"`);
  }
  if (p.type === 'brand') {
    const brand = brands.find((b) => b.slug === p.brand);
    if (!(p.copy.faq ?? []).some((f) => /authori[sz]ed/i.test(f.q))) err(where, `brand FAQ must answer "Are you an authorized ${brand?.name} servicer?" head-on (brand-page-copy)`);
  }
  const text = JSON.stringify(p.copy);
  if (p.type !== 'about') for (const n of names) if (text.includes(n)) err(where, `personal name "${n}" (names belong only on the About page)`);
  for (const b of banned) if (text.toLowerCase().includes(b)) err(where, `banned phrase "${b}" (persona compliance)`);
}
for (const b of brands) if (!pages.find((p) => p.key === `brand:${b.slug}`)?.live) warn('brands.json', `brand "${b.slug}" has no page copy yet`);

// ---------- keyword map ----------
const primaries = {};
for (const [path, kw] of Object.entries(keywords)) {
  if (path.startsWith('_')) continue;
  if (!pages.find((p) => p.path === path)) warn('keywords.json', `${path} is not a planned page (old URL pattern or removed page?)`);
  if (!kw.primary) continue;
  (primaries[kw.primary.trim().toLowerCase()] ??= []).push(path);
}
for (const [k, paths] of Object.entries(primaries)) if (paths.length > 1) err('keywords.json', `primary keyword "${k}" is assigned to ${paths.length} pages (${paths.join(', ')}); one primary per page`);

// ---------- stray copy files ----------
const planned = new Set(pages.map((p) => p.copyFile).filter(Boolean));
const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)])) : []);
for (const file of walk(join(ROOT, 'content', 'pages'))) {
  if (file.endsWith('.json') && !planned.has(file)) err(rel(file), 'copy file matches no planned page (check the slug against services/locations/brands, or countyPages)');
}

// ---------- house style + fact consistency across all content ----------
const EM = /—|&mdash;|&#8212;/;
const warrantyDays = site.fixedFacts?.warranty?.match(/(\d+)-day/)?.[1];
const phoneRe = /\(?\b\d{3}\)?[ .-]\d{3}-\d{4}\b/g;
for (const file of walk(join(ROOT, 'content'))) {
  const raw = readFileSync(file, 'utf8');
  const decoded = file.endsWith('.json') ? JSON.stringify(JSON.parse(raw)) : raw;
  if (EM.test(decoded)) {
    const line = raw.split('\n').findIndex((l) => EM.test(l));
    err(`${rel(file)}${line >= 0 ? `:${line + 1}` : ''}`, 'em dash (IZY house style: no em dashes; use a comma, colon or period)');
  }
  if (warrantyDays) for (const m of decoded.matchAll(/(\d+)-day (?:parts and labor )?warranty/gi)) if (m[1] !== warrantyDays) err(rel(file), `"${m[0]}" contradicts fixedFacts.warranty (${site.fixedFacts.warranty}); state each fact one way everywhere`);
  for (const m of decoded.matchAll(phoneRe)) if (m[0] !== site.phone && !file.endsWith('site.json')) err(rel(file), `phone "${m[0]}" differs from site.phone "${site.phone}" (NAP consistency)`);
}

// Live content rule (Artem, 28 Oct 2026): reviews come only from a live widget, never pasted text.
if (site.reviewsWidget?.provider !== 'static' && reviews.length > 0) err('content/reviews.json', `${reviews.length} pasted review(s): reviews must come from the live widget (site.reviewsWidget), not copied text. Empty reviews.json.`);
if (!site.reviewsWidget?.id && site.reviewsWidget?.provider !== 'static') warn('site.json', 'reviewsWidget.id is empty: the reviews block shows the Google rating and a link until the live widget id is added');
if (!site.pricing?.items?.length) warn('site.json', 'pricing is empty: add the client-confirmed service call and visit prices (the "What a Visit Costs" block)');
if (site.callback && !site.callback.webhookUrl) warn('site.json', 'callback.webhookUrl is empty: the call-back form stays hidden until the GoHighLevel webhook is added');
if (!cities.some((ci) => ci.zips?.length)) warn('locations.json', 'no ZIP codes yet: the ZIP checker on the service area hub stays hidden');
if ([site.gbpUrl, ...(site.sameAs ?? [])].filter(Boolean).length < 2) warn('site.json', 'fewer than two social profiles: add every live profile (Facebook, Instagram, YouTube, Yelp, Nextdoor) to sameAs so the footer icons show the business is active');
// Trust sections: certificates and licenses, partners, brands. Requested from the
// client at kickoff (intake checklist); each block stays hidden until its data exists.
const fileExists = (src) => !src || /^https?:\/\//.test(src) || existsSync(join(ROOT, 'public', src.replace(/^\//, '')));
for (const [i, c] of (site.credentials ?? []).entries()) {
  const where = `site.json credentials[${i}]`;
  if (!c.name || !c.issuer) err(where, 'every certificate or license needs a name and the body that issued it (issuer)');
  if (!c.verifyUrl && !c.image?.src) err(where, `"${c.name ?? '?'}" has no proof: add verifyUrl (the public record) or image (a scan the client sent). Only real credentials go on the site.`);
  if (c.image?.src && !fileExists(c.image.src)) err(where, `image ${c.image.src} not found in public/`);
}
const brandNames = (site.brandsWeRepair ?? []).map((b) => (typeof b === 'string' ? b : b?.name ?? ''));
for (const [i, b] of (site.brandsWeRepair ?? []).entries()) {
  if (typeof b === 'object' && b?.logo?.src && !fileExists(b.logo.src)) err(`site.json brandsWeRepair[${i}]`, `logo ${b.logo.src} not found in public/`);
}
// Manufacturer logos are shown only next to the independence note.
const brandLogoDir = join(ROOT, 'public', 'brand-logos');
const anyBrandLogo = (site.brandsWeRepair ?? []).some((b) => typeof b === 'object' && b?.logo?.src) || (existsSync(brandLogoDir) && readdirSync(brandLogoDir).some((f) => /\.(svg|png|webp)$/.test(f)));
if (anyBrandLogo && !site.brandsNote) err('site.json', 'brand logos are shown but brandsNote is empty: add the independence line (for example "We are independent: we repair these brands, but we are not part of any manufacturer\'s service network.")');
for (const [i, p] of (site.partners ?? []).entries()) {
  const where = `site.json partners[${i}]`;
  if (!p.name) err(where, 'every partner needs a name');
  if (p.logo?.src && !fileExists(p.logo.src)) err(where, `logo ${p.logo.src} not found in public/`);
  const brandHit = brandNames.find((b) => b.toLowerCase() === String(p.name ?? '').toLowerCase());
  if (brandHit) err(where, `"${p.name}" is a manufacturer the client repairs, not a partner: keep it in brandsWeRepair only (a manufacturer listed as a partner reads as an authorization claim)`);
}
if (!site.credentials?.length) warn('site.json', 'credentials is empty: ask the client for every license and certificate (number, issuer, scan or public record link); the "Certificates and Licenses" block stays hidden');
if (!site.partners?.length) warn('site.json', 'partners is empty: ask the client which companies they work with (home warranty companies, property managers, suppliers, associations) and whether their logos may be shown');
if (!site.brandsWeRepair?.length) warn('site.json', 'brandsWeRepair is empty: list the brands the client repairs (logos from npm run brand-logos or public/brand-logos/) so the "Brands We Repair" block shows');
if (!site.mapEmbedUrl) warn('site.json', 'mapEmbedUrl is empty: add the Google Maps embed of the client\'s own GBP listing');

// ---------- scheduled publishing ----------
const today = data.today;
for (const p of pages.filter((x) => x.copy?.publishDate)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.copy.publishDate))) err(rel(p.copyFile), `publishDate must be YYYY-MM-DD (got ${p.copy.publishDate})`);
}
const scheduled = pages.filter((p) => p.scheduled).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
const held = pages.filter((p) => p.held).sort((a, b) => a.held.localeCompare(b.held));
// Content from the monthly growth cycle (anything with publishDate) carries its brief and an
// independent review that passed (docs/review-rubric.md). The review is written by an agent
// that did not write the page; "Verdict: PASS" on its own line is the pass mark.
for (const p of pages.filter((x) => x.copy?.publishDate)) {
  const where = rel(p.copyFile);
  const g = p.copy.growth ?? {};
  if (!g.brief || !existsSync(join(ROOT, g.brief))) err(where, `growth.brief must point to the page's brief (docs/growth/briefs/YYYY-MM/<slug>.md); got ${g.brief ?? 'nothing'}`);
  if (!g.review || !existsSync(join(ROOT, g.review))) err(where, `growth.review must point to the independent review (docs/growth/reviews/YYYY-MM/<slug>.md); got ${g.review ?? 'nothing'}`);
  else if (!/^Verdict:\s*PASS\s*$/m.test(readFileSync(join(ROOT, g.review), 'utf8'))) err(where, `review ${g.review} has no "Verdict: PASS" line: rewrite the page until the reviewer passes it, or drop it`);
}
// Change ledger (docs/growth/ledger.json): every entry needs a path, kind, live date and baseline.
{
  const lp = join(ROOT, 'docs', 'growth', 'ledger.json');
  if (existsSync(lp)) {
    let ledger;
    try { ledger = JSON.parse(readFileSync(lp, 'utf8')); } catch (e) { err('docs/growth/ledger.json', `invalid JSON: ${e.message}`); }
    for (const [i, c] of (ledger?.changes ?? []).entries()) {
      const w = `docs/growth/ledger.json changes[${i}]`;
      if (!c.path || !c.kind || !c.live) err(w, 'needs path, kind (new | refresh | title-meta | tech) and live (YYYY-MM-DD)');
      if (c.kind && !['new', 'refresh', 'title-meta', 'tech'].includes(c.kind)) err(w, `kind "${c.kind}" is not new | refresh | title-meta | tech`);
      if (!c.baseline) err(w, 'needs a baseline (impressions, clicks, position over the 28 days before the change; zeros for a new page)');
    }
  }
}
// Copy may not link to a page that is not live yet: the link would 404 until the publish date.
// Template links (cards, tiles, menus) appear on their own once the page is live.
const scheduledPaths = new Set(scheduled.map((p) => p.path));
for (const p of pages.filter((x) => x.live && x.copyFile)) {
  const text = existsSync(p.copyFile) ? readFileSync(p.copyFile, 'utf8') : '';
  for (const m of text.matchAll(/\]\((\/[^)\s#]*)/g)) {
    if (scheduledPaths.has(m[1])) err(rel(p.copyFile), `links to ${m[1]}, which is scheduled for ${pages.find((x) => x.path === m[1]).scheduled}: add the link on or after that date`);
  }
}
if (!site.timezone && scheduled.length) warn('site.json', 'timezone is not set: scheduled pages go live by UTC date (set e.g. "America/Denver")');

// ---------- coverage report ----------
const missing = pages.filter((p) => !p.live && !p.scheduled && !p.held && p.type !== 'blog-post');
const byType = {};
for (const p of missing) (byType[p.type] ??= []).push(p.path);
console.log(`\nContent check: ${live.length} live pages, ${missing.length} planned pages without copy yet.`);
for (const [type, paths] of Object.entries(byType)) console.log(`  ${type} (${paths.length}): ${paths.slice(0, 6).join(', ')}${paths.length > 6 ? ', ...' : ''}`);
if (scheduled.length) {
  console.log(`\nScheduled (${scheduled.length}, today is ${today}):`);
  for (const p of scheduled) console.log(`  ${p.scheduled}  ${p.path}`);
}
if (held.length) {
  console.log(`\nHeld for a fact-check (${held.length}): due, but no factCheck after the last edit, so not published:`);
  for (const p of held) console.log(`  ${p.held}  ${p.path}  (${rel(p.copyFile)})`);
}
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s)`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length) {
  console.error(`\n✖ ${errors.length} content error(s). Fix these before building:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n✔ Content is valid.\n');
