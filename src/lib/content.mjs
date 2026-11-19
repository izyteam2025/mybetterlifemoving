// Loads /content and builds the page registry: every page the site map plans,
// its URL on the IZY standard, and whether its copy exists (live). Templates,
// sitemap, llms.txt, redirects and the gate all read from this one registry.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { routes, UMBRELLA } from './routes.mjs';

const ROOT = process.cwd();
const C = (...p) => join(ROOT, 'content', ...p);

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid JSON in ${path.replace(ROOT + '/', '')}: ${err.message}`);
  }
}
const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')) : []);

let cache = null;

export function loadContent() {
  if (cache) return cache;

  const site = readJson(C('site.json'));
  const services = readJson(C('services.json'), []);
  const locations = readJson(C('locations.json'), { counties: [] });
  const brands = readJson(C('brands.json'), []);
  const authors = readJson(C('authors.json'), []);
  const keywords = readJson(C('keywords.json'), {});
  const reviews = readJson(C('reviews.json'), []).filter((r) => r.text);

  const counties = locations.counties ?? [];
  const useCountyPages = locations.countyPages !== false && counties.some((c) => c.slug);
  const cities = counties
    .flatMap((county) => (county.cities ?? []).map((city) => ({ ...city, county: county.slug, countyName: county.name })))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Scheduled publishing: a copy file with "publishDate" (YYYY-MM-DD), or a blog post whose
  // date is in the future, stays out of the build until that day in the site's time zone.
  // The daily publish workflow rebuilds the site so it goes live on the day.
  // Nothing scheduled goes live without a person's fact-check (Artem 3 Nov 2026): a page with
  // "publishDate" is held, even on or after its date, until factCheck is filled in on or after
  // its last edit ("updated").
  const today = buildDate(site);
  const scheduledFor = (copy, field) => (copy?.[field] && String(copy[field]) > today ? String(copy[field]) : null);
  const heldFor = (copy) => (copy?.publishDate && !scheduledFor(copy, 'publishDate') && !factChecked(copy) ? String(copy.publishDate) : null);
  const posts = loadPosts().map((p) => ({ ...p, scheduled: scheduledFor(p, p.publishDate ? 'publishDate' : 'date'), held: heldFor(p) }));
  const pages = [];
  const add = (page) => {
    const copy = page.copyFile ? readJson(page.copyFile) : null;
    const scheduled = scheduledFor(copy, 'publishDate');
    const held = heldFor(copy);
    pages.push({ ...page, copy, scheduled, held, live: Boolean(copy) && !copy?.draft && !scheduled && !held });
  };
  const P = (...p) => C('pages', ...p);

  add({ key: 'home', type: 'home', path: routes.home(), copyFile: P('home.json') });
  add({ key: 'services-hub', type: 'services-hub', path: routes.servicesHub(), copyFile: P('services.json') });
  for (const s of services) add({ key: `service:${s.slug}`, type: 'service', path: routes.service(s.slug), service: s.slug, copyFile: P('services', `${s.slug}.json`) });
  add({ key: 'areas-hub', type: 'areas-hub', path: routes.areasHub(), copyFile: P('service-area.json') });
  if (useCountyPages) {
    for (const county of counties) add({ key: `county:${county.slug}`, type: 'county', path: routes.county(county.slug), county: county.slug, copyFile: P('counties', `${county.slug}.json`) });
  }
  // The target city is served by the home page and the main service pages (their H1s and
  // titles already say "in [Target City]"). Separate target-city city and city service
  // pages would chase the same searches and compete with them, so none are planned;
  // their old URLs 301 to the main pages (scripts/postbuild.mjs). Agency rule, Artem 31 Oct 2026.
  // Opt-in (site.targetCityPages: true, Artem 20 Nov 2026): multi-market clients where every
  // market, the target city included, gets its own city and city service pages. Main service
  // pages then drop the city from their H1 and title, so they do not compete with them.
  for (const city of cities.filter((c) => site.targetCityPages || c.name !== site.targetCity)) {
    add({ key: `city:${city.slug}`, type: 'city', path: routes.city(city.slug), city: city.slug, county: city.county, copyFile: P('cities', `${city.slug}.json`) });
    for (const s of services) {
      add({ key: `city-service:${city.slug}:${s.slug}`, type: 'city-service', path: routes.cityService(city.slug, s.slug), city: city.slug, county: city.county, service: s.slug, copyFile: P('city-services', city.slug, `${s.slug}.json`) });
    }
  }
  if (brands.length) {
    add({ key: 'brands-hub', type: 'brands-hub', path: routes.brandsHub(), copyFile: P('brands-hub.json') });
    for (const b of brands) add({ key: `brand:${b.slug}`, type: 'brand', path: routes.brand(b.slug), brand: b.slug, copyFile: P('brands', `${b.slug}.json`) });
  }
  add({ key: 'about', type: 'about', path: routes.about(), copyFile: P('about.json') });
  add({ key: 'faq', type: 'faq', path: routes.faq(), copyFile: P('faq.json') });
  add({ key: 'reviews', type: 'reviews', path: routes.reviews(), copyFile: P('reviews.json') });
  add({ key: 'blog-hub', type: 'blog-hub', path: routes.blogHub(), copyFile: P('blog.json') });
  for (const post of posts) {
    pages.push({ key: `post:${post.slug}`, type: 'blog-post', path: routes.blogPost(post.slug), post: post.slug, copy: post, scheduled: post.scheduled, held: post.held, live: !post.draft && !post.scheduled && !post.held, copyFile: post.file });
  }
  add({ key: 'contact', type: 'contact', path: routes.contact(), copyFile: P('contact.json') });
  for (const slug of listJson(P('extra'))) add({ key: `page:${slug}`, type: 'page', path: routes.page(slug), slug, copyFile: P('extra', `${slug}.json`) });

  // Guides: extra pages marked "guide": true in their copy (cost guides, how-to pages that
  // are not dated posts). They are listed on the blog hub next to the posts (team review,
  // 3 Nov 2026), so cost guides are reachable from the menu, not only from the FAQ page.
  for (const p of pages) if (p.type === 'page' && p.copy?.guide && p.live) p.guide = true;
  // No blog hub until a post or a guide is live (an empty hub is a thin page; build lesson, 28 Oct 2026).
  const hub = pages.find((p) => p.type === 'blog-hub');
  if (hub?.live && !pages.some((p) => (p.type === 'blog-post' && p.live) || p.guide)) hub.live = false;
  const byPath = new Map(pages.map((p) => [p.path, p]));
  cache = { site, services, counties, cities, brands, authors, keywords, reviews, posts, pages, byPath, useCountyPages, umbrellaSlug: UMBRELLA, today };
  return cache;
}

// A person checked every fact, the title, meta, schema and alt text after the last edit.
export function factChecked(copy) {
  const fc = copy?.factCheck;
  if (!fc?.by || !fc?.date) return false;
  return String(fc.date) >= String(copy.updated ?? copy.publishDate ?? '');
}

// Today's date in the site's time zone (site.timezone, e.g. "America/Denver"; UTC when unset).
// BUILD_DATE=YYYY-MM-DD overrides it, to preview what goes live on a given day.
function buildDate(site) {
  if (process.env.BUILD_DATE) return process.env.BUILD_DATE;
  return new Date().toLocaleDateString('en-CA', { timeZone: site?.timezone || 'UTC' });
}

function loadPosts() {
  const dir = C('blog');
  if (!existsSync(dir)) return [];
  const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const { data, content } = matter(readFileSync(join(dir, file), 'utf8'));
      const factCheck = data.factCheck ? { ...data.factCheck, date: iso(data.factCheck.date) } : undefined;
      return { ...data, date: iso(data.date), updated: iso(data.updated ?? data.date), publishDate: data.publishDate ? iso(data.publishDate) : undefined, factCheck, slug: data.slug ?? file.replace(/\.md$/, ''), body: content, file: join(dir, file) };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// ---------- lookups ----------
export const livePages = () => loadContent().pages.filter((p) => p.live);
export const pageByPath = (path) => loadContent().byPath.get(path);
export const isLive = (path) => Boolean(pageByPath(path)?.live);
export const liveHref = (path) => (isLive(path) ? path : null);
export const getService = (slug) => loadContent().services.find((s) => s.slug === slug);
export const getCounty = (slug) => loadContent().counties.find((c) => c.slug === slug);
export const getCity = (slug) => loadContent().cities.find((c) => c.slug === slug);
export const getBrand = (slug) => loadContent().brands.find((b) => b.slug === slug);
export const getAuthor = (slug) => loadContent().authors.find((a) => a.slug === slug);
export const citiesInCounty = (county) => loadContent().cities.filter((c) => c.county === county);
export const livePosts = () => loadContent().posts.filter((p) => !p.draft && !p.scheduled && !p.held);
// Article types for the blog filters (agency default; site.blog.types overrides or extends it).
// A post sets `type` in its frontmatter, a guide in its copy file.
export const DEFAULT_BLOG_TYPES = {
  troubleshooting: 'Troubleshooting',
  'cost-guide': 'Cost Guide',
  maintenance: 'Maintenance',
  'repair-or-replace': 'Repair or Replace',
  local: 'Local Guide',
  news: 'Company News',
};
export const blogTypes = () => ({ ...DEFAULT_BLOG_TYPES, ...(loadContent().site.blog?.types ?? {}) });

// Live guides (extra pages with "guide": true): { path, title, description, services, cities, type, date }.
export const liveGuides = () => loadContent().pages.filter((p) => p.guide).map((p) => ({
  kind: 'guide',
  path: p.path,
  title: p.copy.hero?.h1 ?? p.slug,
  description: p.copy.meta?.description ?? '',
  services: p.copy.services ?? [],
  cities: p.copy.cities ?? [],
  type: p.copy.type ?? null,
  date: p.copy.updated ?? null,
}));

// Everything the blog hub lists, newest first: live posts and live guides in one list.
export function blogItems() {
  const posts = livePosts().map((p) => ({
    kind: 'post',
    path: routes.blogPost(p.slug),
    title: p.title,
    description: p.metaDescription ?? '',
    services: p.services ?? [],
    cities: p.cities ?? [],
    type: p.type ?? null,
    date: p.updated ?? p.date ?? null,
  }));
  return [...posts, ...liveGuides()].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

// noindex: set in the copy file, or automatic for the reviews page while no reviews widget is
// installed (a page with only a rating line is thin; it becomes indexable the day the widget id is set).
export function noindexFor(page) {
  if (page.copy?.noindex) return true;
  return page.type === 'reviews' && !loadContent().site.reviewsWidget?.id;
}
// Pages and posts written and waiting for their publish date, soonest first.
export const scheduledPages = () => loadContent().pages.filter((p) => p.scheduled).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
// Due pages waiting for a person's fact-check before they can go live.
export const heldPages = () => loadContent().pages.filter((p) => p.held).sort((a, b) => a.held.localeCompare(b.held));

// The site's single conversion destination (contact page unless the client overrides it).
export const ctaPath = () => loadContent().site.cta?.path ?? routes.contact();
export const ctaLabel = () => loadContent().site.cta?.label ?? 'Book a Repair';
// FAQ closing CTAs go to the FAQ page when it is live, otherwise to the conversion page.
export const faqCtaPath = () => (isLive(routes.faq()) ? routes.faq() : ctaPath());

// Where a city link goes: the target city lives on the home page (and, per service, on the
// main service page); every other city has its own page once its copy is live.
export const isTargetCity = (city) => city?.name === loadContent().site.targetCity;
// True when the target city is served by the home and main service pages instead of its own pages.
export const servedByMainPages = (city) => !loadContent().site.targetCityPages && isTargetCity(city);
// State for a city: its own region in locations.json (multi-state sites), else the business address.
export const regionFor = (city) => city?.region ?? loadContent().site.address?.region;
export const cityHref = (city) => (servedByMainPages(city) ? routes.home() : liveHref(routes.city(city.slug)));
export const cityServiceHref = (city, service) => (servedByMainPages(city) ? liveHref(routes.service(service)) : liveHref(routes.cityService(city.slug, service)));

// Cities in Service Area menu order: the target city first, then alphabetical.
export function citiesTargetFirst() {
  const { site, cities } = loadContent();
  const target = cities.find((c) => c.name === site.targetCity);
  return target ? [target, ...cities.filter((c) => c !== target)] : cities;
}

// ---------- titles, headings, descriptions ----------
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'via', 'with']);
export function titleCase(str = '') {
  return String(str)
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// H1 formats fixed by the agency skills. Templates use these; the gate checks them.
export function standardH1(page) {
  const { site, keywords } = loadContent();
  const umbrella = titleCase(site.umbrellaKeyword);
  switch (page.type) {
    case 'service': {
      const P = titleCase(keywords[page.path]?.primary ?? getService(page.service).name);
      return site.targetCityPages ? P : `${P} in ${site.targetCity}`;
    }
    case 'city': return `${umbrella} in ${getCity(page.city).name}`;
    case 'county': return `${umbrella} in ${getCounty(page.county).name}`;
    case 'city-service': return `${getService(page.service).name} in ${getCity(page.city).name}, ${regionFor(getCity(page.city))}`;
    default: return null;
  }
}
export const h1For = (page) => standardH1(page) ?? page.copy?.hero?.h1 ?? page.copy?.title;

// Title tag: "Primary Keyword | Company". Service pages add the target city when it fits
// in 60 characters. An explicit `title` in keywords.json always wins.
export function titleFor(page) {
  const { site, keywords } = loadContent();
  const name = site.titleName ?? site.name;
  if (page.type === 'blog-post') return page.copy.metaTitle ?? `${page.copy.title} | ${name}`;
  const kw = keywords[page.path];
  if (kw?.title) return kw.title;
  const P = titleCase(kw?.primary ?? h1For(page) ?? site.name);
  const short = P.replace(/ in /i, ' ').replace(/,/g, '');
  const options = page.type === 'service' && !site.targetCityPages
    ? [`${P} in ${site.targetCity} | ${name}`, `${P} ${site.targetCity} | ${name}`, `${P} | ${name}`]
    : [`${P} | ${name}`, `${short} | ${name}`];
  return options.find((t) => t.length <= 60) ?? options[options.length - 1];
}

export function descriptionFor(page) {
  if (page.type === 'blog-post') return page.copy.metaDescription;
  return page.copy?.meta?.description;
}

export const updatedFor = (page) => (page.type === 'blog-post' ? page.copy.updated : page.copy?.updated ?? null);

// One wording for hours everywhere (matches fixedFacts.hours style): "Monday to Friday: 8 AM to 7 PM".
const ampm = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
};
export const formatHours = (h) => `${h.days.length > 1 ? `${h.days[0]} to ${h.days[h.days.length - 1]}` : h.days[0]}: ${ampm(h.opens)} to ${ampm(h.closes)}`;
