#!/usr/bin/env node
// Gate step 2: audits the BUILT site in /dist against the IZY standards (URL standard,
// per-page-type internal linking, on-page SEO, schema, AEO answer format, GEO
// citation surface, blog SOP, compliance, NAP consistency). Errors fail the build and
// block the deploy. Writes .seo-report.json for Claude to read. Run: npm run seo:check

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { loadContent, standardH1, ctaPath } from '../src/lib/content.mjs';
import { LOCATION_TYPES, routes } from '../src/lib/routes.mjs';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('✖ dist/ not found. Run the build first.');
  process.exit(1);
}

const C = loadContent();
const { site, keywords, byPath, services, cities, brands } = C;
const SITE_HOST = new URL(site.url).host;
const TITLE_NAME = site.titleName ?? site.name;
const CTA = ctaPath();
const issues = [];
const E = (page, rule, msg) => issues.push({ level: 'error', page, rule, msg });
const W = (page, rule, msg) => issues.push({ level: 'warn', page, rule, msg });

// ---------- load built pages ----------
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const all = walk(DIST);
const htmlFiles = all.filter((f) => f.endsWith('.html') && !f.endsWith('404.html'));
const toPath = (f) => '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const existingPaths = new Set(htmlFiles.map(toPath));
const existingFiles = new Set(all.map((f) => '/' + relative(DIST, f).replace(/\\/g, '/')));
const redirects = existsSync(join(DIST, '_redirects'))
  ? readFileSync(join(DIST, '_redirects'), 'utf8').split('\n').filter(Boolean).map((l) => l.trim().split(/\s+/))
  : [];
const redirectFrom = new Map(redirects.map(([f, t]) => [f, t]));

const norm = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s = '') => String(s).split(/\s+/).filter(Boolean).length;
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'via', 'with', 'nor', 'per', 'from', 'into', 'than', 'up']);
const LENGTH = { service: [900, 1400], city: [650, 1000], county: [700, 1100], 'services-hub': [600, 950], 'areas-hub': [600, 900] };

const pages = htmlFiles.map((file) => {
  const path = toPath(file);
  const raw = readFileSync(file, 'utf8');
  const root = parse(raw, { comment: false });
  const reg = byPath.get(path);
  const ld = root.querySelectorAll('script[type="application/ld+json"]').map((s) => { try { return JSON.parse(s.text); } catch { return { __invalid: true }; } });
  const nodes = ld.flatMap((b) => b['@graph'] ?? [b]);
  return {
    path, raw, root, reg, ld, nodes,
    type: reg?.type ?? 'unknown',
    main: root.querySelector('main'),
    title: root.querySelector('title')?.text.trim() ?? '',
    description: root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    robots: root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    h1s: root.querySelectorAll('h1').map((h) => h.text.trim()),
  };
});
const typesOf = (p) => p.nodes.flatMap((n) => [].concat(n['@type'] ?? []));

// Resolve an href to an internal path (or null for external / non-page links).
function internal(href) {
  if (!href || /^(tel:|mailto:|#|javascript:)/i.test(href)) return null;
  let u;
  try { u = new URL(href, site.url); } catch { return null; }
  if (u.host !== SITE_HOST) return null;
  return { path: u.pathname, search: u.search, raw: href };
}

// ---------- the internal link matrix (body copy in <main> only) ----------
// Derived from the agency skills: who may link to whom. Nav, footer and breadcrumbs
// sit outside <main> and are not counted. The conversion page is always allowed.
const T = (path) => byPath.get(path)?.type;
const isType = (path, ...types) => types.includes(T(path));
// Client conversion pages listed in site.navExtra (e.g. a membership page) count as
// conversion destinations: any page may link to them, like the CTA.
const CONVERSION_EXTRA = new Set((site.navExtra ?? []).map((x) => x.href));
function allowed(page, target) {
  if (target === CTA || target === page.path || CONVERSION_EXTRA.has(target)) return true;
  const r = page.reg;
  switch (page.type) {
    case 'home': return isType(target, 'services-hub', 'service', 'areas-hub', 'city', 'county', 'brands-hub', 'brand', 'about', 'faq', 'reviews', 'blog-hub', 'blog-post', 'contact');
    // Hubs and county pages link the target city to the home page, which serves it.
    case 'services-hub':
    case 'areas-hub': return isType(target, 'service', 'city', 'county', 'faq', 'contact') || target === routes.home();
    case 'service': return (T(target) === 'city-service' && byPath.get(target).service === r.service) || isType(target, 'areas-hub', 'faq');
    case 'county': return (T(target) === 'city' && byPath.get(target).county === r.county) || isType(target, 'service', 'areas-hub') || target === routes.home();
    case 'city': return (T(target) === 'city-service' && byPath.get(target).city === r.city) || isType(target, 'brand', 'brands-hub');
    case 'city-service': return isType(target, 'faq');
    case 'brand': return isType(target, 'faq', 'brands-hub', 'brand');
    case 'brands-hub': return isType(target, 'brand', 'faq');
    default: return true; // blog, about, faq, reviews, contact, extra pages
  }
}
const RULE_NOTE = {
  service: 'a main service page links only to its own city service pages, the service area hub and the FAQ page (service-page-copy)',
  city: 'a city page links only down, to its own city service pages and brand pages (city-page-copy, 26 Oct 2026)',
  'city-service': 'a city service page links only through its CTAs (city-service-page-copy, 22 Oct 2026)',
  county: 'a county page links to its cities, the main service pages and the service area hub (county-page-copy)',
  'services-hub': 'hubs link main service pages and main city pages only, never a city service page',
  'areas-hub': 'hubs link main service pages and main city pages only, never a city service page',
  home: 'the homepage stays one level deep: never a city service page',
  brand: 'a brand page links to the FAQ page, the brand hub and sister brands only (brand-page-copy)',
  'brands-hub': 'the brand hub links to brand pages',
};

// Links every page of a type must carry (completeness).
function mustLink(page) {
  const live = (path) => byPath.get(path)?.live;
  const r = page.reg;
  switch (page.type) {
    case 'home':
    case 'services-hub':
    case 'areas-hub':
      return [...services.map((s) => routes.service(s.slug)), ...cities.map((c) => routes.city(c.slug))].filter(live);
    case 'service': return cities.map((c) => routes.cityService(c.slug, r.service)).filter(live);
    case 'city': return services.map((s) => routes.cityService(r.city, s.slug)).filter(live);
    case 'county': return cities.filter((c) => c.county === r.county).map((c) => routes.city(c.slug)).filter(live);
    case 'brands-hub': return brands.map((b) => routes.brand(b.slug)).filter(live);
    default: return [];
  }
}

// Pages that link here (a set of source pages, not a link count).
const inbound = new Map([...existingPaths].map((p) => [p, new Set()]));
const names = site.compliance?.personNames ?? [];
const banned = (site.compliance?.bannedPhrases ?? []).map((b) => b.toLowerCase());
const competitorHosts = (site.competitors ?? []).map((d) => d.replace(/^www\./, '').toLowerCase());

for (const p of pages) {
  const { path, root, main } = p;

  // ---- head ----
  if (!root.querySelector('html')?.getAttribute('lang')) E(path, 'html-lang', '<html> has no lang attribute');
  if (!root.querySelector('meta[name="viewport"]')) E(path, 'viewport', 'missing viewport meta');
  if (!root.querySelector('meta[property="og:image"]')) E(path, 'og-image', 'missing og:image');
  if (!p.title) E(path, 'title', 'missing <title>');
  else {
    if (p.type !== 'blog-post' && !p.title.endsWith(` | ${TITLE_NAME}`)) E(path, 'title-format', `title must follow "Primary Keyword | ${TITLE_NAME}" (got "${p.title}")`);
    if (p.title.length > 60) E(path, 'title-length', `title is ${p.title.length} chars (max 60; set "title" in keywords.json or a shorter site.titleName)`);
    if (p.type === 'blog-post' && p.title.length < 50) E(path, 'title-length', `blog meta title is ${p.title.length} chars (blog SOP: 50 to 60)`);
  }
  if (!p.description) E(path, 'description', 'missing meta description');
  else if (p.type === 'blog-post' && (p.description.length < 150 || p.description.length > 160)) E(path, 'description-length', `blog meta description is ${p.description.length} chars (blog SOP: 150 to 160)`);
  else if (p.description.length < 70 || p.description.length > 165) E(path, 'description-length', `meta description is ${p.description.length} chars (keep 120 to 160)`);
  else if (p.description.length < 120 || p.description.length > 160) W(path, 'description-length', `meta description is ${p.description.length} chars (aim for 120 to 160)`);
  const expected = new URL(path, site.url).href;
  if (p.canonical !== expected) E(path, 'canonical', `canonical is "${p.canonical}", expected "${expected}"`);

  // ---- headings ----
  if (p.h1s.length !== 1) E(path, 'h1', `found ${p.h1s.length} H1 tags; exactly one per page`);
  const std = p.reg ? standardH1(p.reg) : null;
  if (std && p.h1s[0] !== std) E(path, 'h1-format', `H1 must be "${std}" (agency H1 standard), got "${p.h1s[0]}"`);
  let prev = 1;
  for (const h of (main ?? root).querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const lvl = Number(h.tagName[1]);
    if (lvl > prev + 1) E(path, 'heading-order', `"${h.text.trim().slice(0, 50)}" jumps from H${prev} to H${lvl}`);
    prev = lvl;
  }

  // ---- house style, compliance, NAP ----
  if (/—|&mdash;|&#8212;/.test(p.raw)) E(path, 'em-dash', 'em dash on the page (IZY house style)');
  if (main) {
    const clone = parse(main.toString());
    clone.querySelectorAll('[data-allow-names]').forEach((n) => n.remove());
    const bodyText = clone.text;
    if (p.type !== 'about') for (const n of names) if (bodyText.includes(n)) E(path, 'person-name', `"${n}" appears in the copy (names belong only on About and blog bylines)`);
    for (const b of banned) if (bodyText.toLowerCase().includes(b)) E(path, 'banned-phrase', `banned phrase "${b}"`);
    const phoneMentions = (main.text.match(new RegExp(site.phone.replace(/[()]/g, '\\$&'), 'g')) ?? []).length;
    const phoneLinked = main.querySelectorAll(`a[href^="tel:"]`).filter((a) => a.text.includes(site.phone)).length;
    if (phoneMentions > phoneLinked) E(path, 'phone-link', `${phoneMentions - phoneLinked} phone number(s) in the body are not clickable tel: links`);
  }
  for (const a of root.querySelectorAll('a[href^="tel:"]')) if (a.getAttribute('href') !== `tel:${site.phoneE164}`) E(path, 'nap', `tel link ${a.getAttribute('href')} differs from site.phoneE164`);
  const hero = root.querySelector('.hero');
  // structuredText keeps list items apart ("$100" + "90-day" is not a ZIP)
  if (hero && /\b\d{5}(?:-\d{4})?\b/.test(hero.structuredText)) E(path, 'hero-zip', 'ZIP code in the hero (keyword in, ZIP codes out)');

  // ---- images ----
  for (const img of root.querySelectorAll('img')) {
    const decorative = img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true';
    const alt = img.getAttribute('alt');
    if (!decorative && (alt === undefined || !alt.trim())) E(path, 'img-alt', `image ${img.getAttribute('src')} has no alt text`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) W(path, 'img-size', `image ${img.getAttribute('src')} has no width/height`);
  }

  // ---- schema ----
  const types = typesOf(p);
  if (!p.ld.length) E(path, 'schema', 'no JSON-LD');
  if (p.ld.some((b) => b.__invalid)) E(path, 'schema', 'JSON-LD is not valid JSON');
  if (!site.schema.types.some((t) => types.includes(t))) E(path, 'schema', 'business node missing');
  if (path !== '/' && !types.includes('BreadcrumbList')) E(path, 'schema', 'BreadcrumbList missing');
  if (['service', 'city-service', 'city', 'county', 'brand'].includes(p.type) && !types.includes('Service')) E(path, 'schema', 'Service node missing');
  if (p.type === 'blog-post' && !(types.includes('BlogPosting') && types.includes('Person'))) E(path, 'schema', 'BlogPosting with a Person author missing');
  // FAQ schema must match the visible questions word for word
  const visibleQ = p.type === 'blog-post' ? blogFaqQuestions(root) : root.querySelectorAll('.faq-item h3').map((h) => h.text.trim());
  const faqNode = p.nodes.find((n) => n['@type'] === 'FAQPage');
  const schemaQ = (faqNode?.mainEntity ?? []).map((q) => q.name);
  if (visibleQ.length && !faqNode) E(path, 'faq-schema', 'visible FAQ has no FAQPage schema');
  if (faqNode && JSON.stringify([...schemaQ].sort()) !== JSON.stringify([...visibleQ].sort())) E(path, 'faq-schema', 'FAQPage schema does not match the visible questions word for word');

  // ---- FAQ answer format (AEO) ----
  if (p.type !== 'blog-post') {
    const items = root.querySelectorAll('.faq-item');
    for (const it of items) {
      const q = it.querySelector('h3')?.text.trim() ?? '';
      if (!q.endsWith('?')) E(path, 'faq-question', `"${q}" is not phrased as a question`);
      const a = it.querySelector('p')?.text ?? '';
      if (words(a) > 60) W(path, 'faq-answer', `answer to "${q.slice(0, 40)}" is ${words(a)} words; lead with a one or two sentence answer`);
    }
    if (['service', 'services-hub', 'areas-hub', 'city-service'].includes(p.type) && items.length && (items.length < 5 || items.length > 6)) W(path, 'faq-count', `${items.length} FAQs (standard: five or six)`);
  }

  // ---- links ----
  const mainLinks = new Set();
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    const text = a.text.trim();
    if (/[?&]utm_/i.test(href)) E(path, 'utm', `link "${href}" carries tracking parameters`);
    if (/^(https?:\/\/|www\.)/i.test(text)) E(path, 'naked-url', `naked URL used as anchor text: ${text}`);
    if (/^(click here|here|read more|this page|learn more)$/i.test(text)) E(path, 'anchor-text', `non-descriptive anchor "${text}"`);
    const t = internal(href);
    if (!t) continue;
    const isFile = /\.[a-z0-9]+$/i.test(t.path);
    if (!isFile && !t.path.endsWith('/')) E(path, 'trailing-slash', `internal link "${href}" has no trailing slash`);
    if (redirectFrom.has(t.path)) { E(path, 'link-to-redirect', `link to "${t.path}" goes through a redirect; link "${redirectFrom.get(t.path)}" directly`); continue; }
    if (isFile ? !existingFiles.has(t.path) : !existingPaths.has(t.path)) { E(path, 'broken-link', `link to "${href}" points to a page that does not exist`); continue; }
    if (!isFile && t.path !== path) (inbound.get(t.path) ?? inbound.set(t.path, new Set()).get(t.path)).add(path);
  }
  if (main) {
    for (const a of main.querySelectorAll('a[href]')) {
      const t = internal(a.getAttribute('href'));
      if (!t || /\.[a-z0-9]+$/i.test(t.path)) continue;
      mainLinks.add(t.path);
      if (existingPaths.has(t.path) && !allowed(p, t.path)) E(path, 'link-rule', `body links to ${t.path} (${T(t.path)}); ${RULE_NOTE[p.type] ?? 'not allowed for this page type'}`);
    }
    for (const need of mustLink(p)) if (!mainLinks.has(need)) E(path, 'link-missing', `body must link ${need} (${T(need)})`);
  }

  // ---- length ----
  if (LENGTH[p.type] && main) {
    const clone = parse(main.toString());
    clone.querySelectorAll('.review, .price, .picker, .zipcheck').forEach((n) => n.remove()); // shared template blocks are not page copy
    const n = words(clone.text);
    const [min, max] = LENGTH[p.type];
    if (n < min) W(path, 'length', `${n} words of copy (standard for a ${p.type} page: ${min} to ${max})`);
    if (n > max) W(path, 'length', `${n} words of copy (standard for a ${p.type} page: ${min} to ${max}; caps, not targets)`);
  }

  // ---- primary keyword placement ----
  const kw = keywords[path]?.primary;
  if (kw && p.type !== 'blog-post') {
    const k = norm(kw);
    if (!norm(p.h1s[0]).includes(k) && !norm(p.title).includes(k) && !norm(p.title).includes(k.replace(/ in /, ' '))) W(path, 'keyword', `primary keyword "${kw}" not in the H1 or title`);
  }

  // ---- blog SOP + GEO citation surface ----
  if (p.type === 'blog-post') blogChecks(p);
}

function blogFaqQuestions(root) {
  const body = root.querySelector('.post-body');
  if (!body) return [];
  const kids = body.childNodes.filter((n) => n.nodeType === 1);
  const i = kids.findIndex((n) => n.tagName === 'H2' && /frequently asked questions|^faqs?$/i.test(n.text.trim()));
  if (i < 0) return [];
  const out = [];
  for (const n of kids.slice(i + 1)) { if (n.tagName === 'H2') break; if (n.tagName === 'H3') out.push(n.text.trim()); }
  return out;
}

function blogChecks(p) {
  const { path, root } = p;
  const article = root.querySelector('article');
  const body = root.querySelector('.post-body');
  if (!article || !body) return E(path, 'blog', 'article markup missing');
  const meta = root.querySelector('.post-meta');
  if (!meta?.querySelector('a[rel="author"]')) E(path, 'blog-author', 'no named author linked to a bio (GEO: a person with a role)');
  if (!meta?.querySelectorAll('time').length) E(path, 'blog-dates', 'no visible published / updated date');

  // Title Case headings
  for (const h of article.querySelectorAll('h1, h2, h3')) {
    const ws = h.text.trim().split(/\s+/);
    const bad = ws.filter((w, i) => {
      const first = w.replace(/^[^A-Za-z0-9]+/, '');
      if (!first || /^[0-9]/.test(first)) return false;
      const edge = i === 0 || i === ws.length - 1;
      if (!edge && SMALL.has(first.toLowerCase().replace(/[^a-z]/g, ''))) return false;
      return first[0] !== first[0].toUpperCase();
    });
    if (bad.length) E(path, 'blog-title-case', `heading "${h.text.trim()}" is not Title Case (${bad.join(', ')})`);
  }

  // Structure: intro, Key Takeaways (4-6), On This Page (= every H2, 4-8), 5-7 sections
  const children = body.childNodes.filter((n) => n.nodeType === 1);
  const ktIdx = children.findIndex((n) => n.tagName === 'H2' && /^key takeaways$/i.test(n.text.trim()));
  if (ktIdx < 0) E(path, 'blog-takeaways', 'Key Takeaways section missing');
  else {
    const list = children.slice(ktIdx + 1).find((n) => ['UL', 'OL'].includes(n.tagName));
    const n = list ? list.querySelectorAll('li').length : 0;
    if (n < 4 || n > 6) E(path, 'blog-takeaways', `Key Takeaways has ${n} bullets (4 to 6)`);
    const intro = children.slice(0, ktIdx).filter((x) => x.tagName === 'P').map((x) => x.text).join(' ');
    const iw = words(intro);
    if (iw < 80 || iw > 120) W(path, 'blog-intro', `intro is ${iw} words (80 to 120)`);
  }
  const toc = body.querySelector('nav.toc');
  const h2s = body.querySelectorAll('h2').filter((h) => !/^(key takeaways|on this page)$/i.test(h.text.trim()));
  if (!toc) E(path, 'blog-toc', 'On This Page block missing');
  else {
    const entries = toc.querySelectorAll('a').map((a) => ({ href: a.getAttribute('href'), text: a.text.trim() }));
    if (entries.length !== h2s.length) E(path, 'blog-toc', `On This Page has ${entries.length} entries for ${h2s.length} H2s`);
    for (const e of entries) {
      const target = body.querySelector(`[id="${e.href.slice(1)}"]`);
      if (!target) E(path, 'blog-toc', `On This Page link ${e.href} has no matching heading id`);
      else if (target.text.trim() !== e.text) E(path, 'blog-toc', `On This Page label "${e.text}" does not mirror the heading "${target.text.trim()}"`);
      if (/^#(section|h2)-?\d+$/.test(e.href)) E(path, 'blog-toc', `non-descriptive anchor id ${e.href}`);
    }
    if (entries.length < 4 || entries.length > 8) W(path, 'blog-toc', `${entries.length} sections in On This Page (4 to 8)`);
  }
  const sections = 1 + h2s.length; // intro + body sections, FAQ, conclusion
  if (sections < 5 || sections > 8) W(path, 'blog-sections', `${sections} sections including intro (standard 5 to 7)`);

  // FAQ: 4-6 questions, each answer opening with a 40-60 word direct answer
  const faqH2 = body.querySelectorAll('h2').find((h) => /frequently asked questions|^faqs?$/i.test(h.text.trim()));
  if (!faqH2) E(path, 'blog-faq', 'FAQ section missing');
  else {
    const after = children.slice(children.indexOf(faqH2) + 1);
    const end = after.findIndex((n) => n.tagName === 'H2');
    const block = end < 0 ? after : after.slice(0, end);
    const qs = block.filter((n) => n.tagName === 'H3');
    if (qs.length < 4 || qs.length > 6) E(path, 'blog-faq', `${qs.length} FAQ questions (4 to 6)`);
    for (const q of qs) {
      if (!q.text.trim().endsWith('?')) E(path, 'blog-faq', `"${q.text.trim()}" is not a question`);
      const first = block[block.indexOf(q) + 1];
      const n = first?.tagName === 'P' ? words(first.text) : 0;
      if (n < 40 || n > 60) E(path, 'blog-faq-answer', `answer to "${q.text.trim().slice(0, 45)}" opens with ${n} words (needs a direct 40 to 60 word answer)`);
    }
  }

  // Internal links: 3 to 5 (TOC, tel and the CTA excluded), varied anchors, one CTA
  const bodyLinks = body.querySelectorAll('a[href]').filter((a) => !a.closest('nav.toc'));
  const internalLinks = bodyLinks.filter((a) => internal(a.getAttribute('href')));
  const ctaLinks = internalLinks.filter((a) => internal(a.getAttribute('href')).path === CTA);
  const contextLinks = internalLinks.filter((a) => internal(a.getAttribute('href')).path !== CTA);
  if (contextLinks.length < 3) E(path, 'blog-internal', `${contextLinks.length} internal links (blog SOP: 3 to 5 plus the CTA)`);
  if (contextLinks.length > 6) W(path, 'blog-internal', `${contextLinks.length} internal links (blog SOP: 3 to 5)`);
  if (ctaLinks.length !== 1) W(path, 'blog-cta', `${ctaLinks.length} CTA links to ${CTA} (one per article)`);
  const anchors = contextLinks.map((a) => norm(a.text));
  for (const dup of anchors.filter((x, i) => anchors.indexOf(x) !== i)) E(path, 'blog-anchors', `anchor "${dup}" used twice`);

  // Outbound links: 3 to 6, one per domain, no competitors, https, new tab + noopener
  const outbound = bodyLinks.filter((a) => /^https?:\/\//.test(a.getAttribute('href')) && !internal(a.getAttribute('href')));
  if (outbound.length < 3) E(path, 'blog-outbound', `${outbound.length} outbound source links (blog SOP: 3 to 6, on the claims they support)`);
  if (outbound.length > 8) E(path, 'blog-outbound', `${outbound.length} outbound links (more than 8 reads like a literature review)`);
  else if (outbound.length > 6) W(path, 'blog-outbound', `${outbound.length} outbound links (3 to 6)`);
  const hosts = outbound.map((a) => new URL(a.getAttribute('href')).host.replace(/^www\./, '').toLowerCase());
  for (const dup of hosts.filter((h, i) => hosts.indexOf(h) !== i)) E(path, 'blog-outbound', `domain ${dup} linked twice (one link per domain)`);
  for (const h of hosts) if (competitorHosts.some((c) => h === c || h.endsWith(`.${c}`))) E(path, 'blog-competitor', `outbound link to competitor ${h}`);
  for (const a of outbound) {
    const href = a.getAttribute('href');
    if (href.startsWith('http://')) W(path, 'blog-outbound', `non-https source ${href}`);
    if (a.getAttribute('target') !== '_blank' || !/noopener/.test(a.getAttribute('rel') ?? '')) E(path, 'blog-outbound', `${href} must open in a new tab with rel="noopener"`);
    if (/nofollow/.test(a.getAttribute('rel') ?? '')) W(path, 'blog-outbound', `${href} is nofollow (authority links stay dofollow)`);
  }
}

// ---------- cross-page checks ----------
const dup = (pick, rule, label) => {
  const seen = new Map();
  for (const p of pages) {
    const v = pick(p);
    if (!v) continue;
    if (seen.has(v)) E(p.path, rule, `duplicate ${label}, also on ${seen.get(v)}`);
    else seen.set(v, p.path);
  }
};
dup((p) => p.title, 'duplicate-title', 'title');
dup((p) => p.description, 'duplicate-description', 'meta description');
dup((p) => p.h1s[0], 'duplicate-h1', 'H1');

// noindex utility pages (thank-you, booking-complete) are reached by redirect, not links.
// Schema image fields must point at real files on this site (catches "[object Object]").
{
  const home = pages.find((p) => p.path === '/');
  const biz = home?.nodes.find((n) => [].concat(n['@type']).includes('LocalBusiness'));
  for (const f of ['logo', 'image']) {
    const v = biz?.[f];
    if (!v) continue;
    const u = new URL(v, site.url);
    if (u.host !== new URL(site.url).host || !existsSync(join(DIST, decodeURIComponent(u.pathname)))) E('/', 'schema-media', `LocalBusiness ${f} "${v}" does not resolve to a file in the build`);
  }
}
// Stock photos (placeholder: true) may go live (agency decision, 28 Oct 2026) and are
// swapped as the client sends real ones. The build reports them as a to-do, never an error.
const placeholderPages = pages.filter((p) => p.raw.includes('data-placeholder="true"')).map((p) => p.path);
if (placeholderPages.length) {
  W('/', 'placeholder-media', `${placeholderPages.length} page(s) still use stock photos (placeholder: true): swap in the client's real photos as they arrive`);
}
for (const p of pages) {
  if (p.path === '/' || /noindex/.test(p.robots)) continue;
  const from = inbound.get(p.path)?.size ?? 0;
  if (!from) E(p.path, 'orphan', 'no other page links here (orphan page)');
  // A page reached from a single page is weakly linked; give it a second route in.
  else if (from === 1) W(p.path, 'one-incoming-link', `only ${[...inbound.get(p.path)][0]} links here: add a body link from a related page (sister guide, hub, FAQ) within the link rules`);
}

// Text-to-HTML ratio under 10%. Not a ranking factor, but a low ratio means
// the page carries markup weight (inlined styles, scripts, icons) instead of copy.
for (const p of pages) {
  if (/noindex/.test(p.robots)) continue;
  const body = parse(p.root.querySelector('body')?.toString() ?? '');
  body.querySelectorAll('script, style, svg, noscript, template').forEach((n) => n.remove());
  const text = body.text.replace(/\s+/g, ' ').trim();
  const ratio = text.length / p.raw.length;
  if (ratio < 0.1) W(p.path, 'text-html-ratio', `text is ${(Math.floor(ratio * 1000) / 10).toFixed(1)}% of the HTML (keep it at 10% or more): check for inlined styles or heavy markup, or thin copy`);
}

// FAQ questions are never reused across pages (the main FAQ page excepted); answers
// are never reused across location pages.
const qSeen = new Map();
const aSeen = new Map();
for (const p of pages.filter((x) => x.type !== 'faq')) {
  const faq = p.nodes.find((n) => n['@type'] === 'FAQPage');
  for (const q of faq?.mainEntity ?? []) {
    const qk = norm(q.name);
    if (qSeen.has(qk) && qSeen.get(qk) !== p.path) E(p.path, 'faq-recycled', `FAQ question "${q.name}" is also on ${qSeen.get(qk)}`);
    else qSeen.set(qk, p.path);
    if (LOCATION_TYPES.includes(p.type)) {
      const ak = norm(q.acceptedAnswer?.text);
      if (aSeen.has(ak) && aSeen.get(ak) !== p.path) E(p.path, 'faq-recycled', `FAQ answer "${String(q.acceptedAnswer?.text).slice(0, 50)}" is also on ${aSeen.get(ak)}`);
      else aSeen.set(ak, p.path);
    }
  }
}

// Main service page vs the target city's city service page: no shared H2, FAQ or sentence.
const target = cities.find((c) => c.name === site.targetCity);
// Compare page copy only: shared site-wide components (numbers, offers, reviews, form, CTA buttons) are excluded.
const sentences = (node) => {
  const clone = parse(node?.toString() ?? '');
  clone.querySelectorAll('.numbers, .offers, .offer-band, .club, .brands-strip, .team, .rating-badge, .gallery, .review, .reviews-live, .reviews-widget, .map, .lead-form, .hero-ctas, .final-ctas, .slogan, .section-cta, .price, .callback, .picker, .zipcheck').forEach((n) => n.remove());
  return new Set(clone.querySelectorAll('p, li, h3, blockquote').flatMap((el) => el.text.split(/[.!?](?:\s+|$)/)).map(norm).filter((s) => words(s) >= 8));
};
for (const s of services) {
  if (!target) break;
  const a = pages.find((p) => p.path === routes.service(s.slug));
  const b = pages.find((p) => p.path === routes.cityService(target.slug, s.slug));
  if (!a || !b) continue;
  const copyH2 = (pg) => pg.main.querySelectorAll('h2').filter((h) => !h.closest('.offers, .offer-band, .club, .brands-strip, .team, .gallery, .reviews-live, .reviews-widget, .price, .picker, .zipcheck'));
  const h2a = new Set(copyH2(a).map((h) => norm(h.text)));
  for (const h of copyH2(b)) if (h2a.has(norm(h.text))) E(b.path, 'service-pair', `H2 "${h.text.trim()}" is also on ${a.path} (the pair must not share wording)`);
  const sa = sentences(a.main);
  for (const sen of sentences(b.main)) if (sa.has(sen)) E(b.path, 'service-pair', `sentence shared with ${a.path}: "${sen.slice(0, 60)}"`);
}

// ---------- copy quality: written by a person, not a template (Artem 31 Oct 2026) ----------
// Google ranks pages on whether they help, not on who or what wrote them, but it demotes
// mass-produced pages ("scaled content abuse": many near-identical pages made to rank) and
// asks that AI-assisted copy is checked by a person. Three checks:
//  1. ai-tells: stock machine-sounding phrases (scripts/ai-tells.json): 'block' fails, 'flag' warns.
//  2. location-template: location pages (city, county, city service) that repeat a sentence or
//     an H2 once the place name is swapped out, or whose copy overlaps another of the same
//     type too much. A page that only changes the city is a doorway page.
//  3. fact-check: every copy file carries factCheck { by, date } from the person who checked
//     its facts; missing or older than the last edit is a warning (a launch checklist item).
const TELLS = JSON.parse(readFileSync(join(ROOT, 'scripts', 'ai-tells.json'), 'utf8'));
const esc = (t) => t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tellRe = (list) => list.map((t) => (t.startsWith('^')
  ? [t.slice(1), new RegExp(`(^|[.!?:]\\s+)${esc(t.slice(1))}($|[^a-z])`, 'i')]
  : [t, new RegExp(`(^|[^a-z])${esc(t)}($|[^a-z])`, 'i')]));
const BLOCK = tellRe(TELLS.block ?? []), FLAG = tellRe(TELLS.flag ?? []);
const copyNode = (node) => {
  const clone = parse(node?.toString() ?? '');
  // Template blocks (team, reviews, gallery, video...) carry built-in headings: drop their whole section.
  clone.querySelectorAll('.numbers, .offers, .offer-band, .club, .brands-strip, .team, .gallery, .reviews-live, .reviews-widget, .map, .lead-form, .price, .callback, .picker, .zipcheck, .partners, .creds, .video-wrap')
    .forEach((n) => (n.closest('section') ?? n).remove());
  // Buttons and small shared bits inside copy sections: drop only the element.
  clone.querySelectorAll('.rating-badge, .review, .hero-ctas, .final-ctas, .slogan, .section-cta, nav, script, style').forEach((n) => n.remove());
  return clone;
};
// One-line service summaries from services.json are shared card text (like a menu), not page copy.
const boilerplate = new Set(services.map((s) => norm(s.summary)).filter(Boolean));
const flagged = new Map();
for (const p of pages) {
  if (!p.main || /noindex/.test(p.robots)) continue;
  const text = copyNode(p.main).text.replace(/\s+/g, ' ');
  for (const [t, re] of BLOCK) if (re.test(text)) E(p.path, 'ai-tells', `"${t}" reads as machine-written or filler: rewrite the sentence in the client's own plain words`);
  const hits = FLAG.filter(([, re]) => re.test(text)).map(([t]) => t);
  if (hits.length) flagged.set(p.path, hits);
}
if (flagged.size) {
  const total = [...flagged.values()].reduce((n, h) => n + h.length, 0);
  W('/', 'ai-tells', `${total} filler phrase(s) on ${flagged.size} page(s) to rewrite by hand: ${[...flagged].slice(0, 6).map(([pg, h]) => `${pg} (${h.join(', ')})`).join('; ')}${flagged.size > 6 ? '; ...' : ''} (full list in .seo-report.json)`);
  for (const [pg, h] of flagged) issues.push({ level: 'info', page: pg, rule: 'ai-tells', msg: `filler: ${h.join(', ')}` });
}

// Motif words: the same "honest", "straight", "fast" on page after page reads as one voice on repeat.
if (TELLS.motifs?.words?.length) {
  const indexable = pages.filter((p) => p.main && !/noindex/.test(p.robots));
  const texts = indexable.map((p) => copyNode(p.main).text.toLowerCase());
  for (const w of TELLS.motifs.words) {
    const re = new RegExp(`\\b${w}\\b`, 'g');
    let onPages = 0, uses = 0;
    for (const t of texts) { const m = t.match(re); if (m) { onPages++; uses += m.length; } }
    if (indexable.length >= 8 && onPages / indexable.length > (TELLS.motifs.maxShare ?? 0.25)) W('/', 'ai-tells', `"${w}" is used ${uses} times on ${onPages} of ${indexable.length} pages: vary it by hand so the site does not repeat one pet word`);
  }
}

// Location pages: swap every place name for a token, then compare.
const counties = (C.counties ?? []).map((c) => c.name);
const placeNames = [...new Set([...cities.map((c) => c.name), ...counties, site.targetCity, site.address?.region].filter(Boolean))].sort((a, b) => b.length - a.length);
const placeRe = placeNames.length ? new RegExp(`\\b(${placeNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi') : null;
const fixed = Object.entries(site.fixedFacts ?? {}).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string').map(([, v]) => norm(v)).filter((v) => words(v) >= 3);
const deplace = (s) => (placeRe ? String(s).replace(placeRe, 'PLACE') : String(s));
const locSentences = (pg) => {
  const out = new Set();
  for (const el of copyNode(pg.main).querySelectorAll('p, li, h3, blockquote')) {
    for (const raw of el.text.split(/[.!?](?:\s+|$)/)) {
      if (boilerplate.has(norm(raw))) continue;
      let s = norm(deplace(raw));
      for (const f of fixed) s = s.replace(f, ' ').replace(/\s+/g, ' ').trim();
      if (words(s) >= 8) out.add(s);
    }
  }
  return out;
};
const shingles = (set, n = 5) => {
  const out = new Set();
  for (const s of set) { const w = s.split(' '); for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' ')); }
  return out;
};
const locPages = pages.filter((p) => LOCATION_TYPES.includes(p.type) && p.main && !/noindex/.test(p.robots)).map((p) => {
  const sents = locSentences(p);
  const h2 = copyNode(p.main).querySelectorAll('h2').map((h) => norm(deplace(h.text))).filter((h) => words(h) >= 3);
  return { p, sents, sh: shingles(sents), h2 };
});
const OVERLAP = { warn: site.copyChecks?.overlapWarn ?? 0.2, error: site.copyChecks?.overlapError ?? 0.35 };
const seenSent = new Map(), seenH2 = new Map();
for (const L of locPages) {
  for (const s of L.sents) {
    const o = seenSent.get(s);
    if (o && o !== L.p.path) E(L.p.path, 'location-template', `same sentence as ${o} with only the place changed: "${s.slice(0, 70)}"`);
    else seenSent.set(s, L.p.path);
  }
  for (const h of L.h2) {
    const o = seenH2.get(h);
    if (o && o !== L.p.path) E(L.p.path, 'location-template', `H2 repeats ${o} with only the place changed: "${h}"`);
    else seenH2.set(h, L.p.path);
  }
}
for (let i = 0; i < locPages.length; i++) for (let j = i + 1; j < locPages.length; j++) {
  const a = locPages[i], b = locPages[j];
  if (a.p.type !== b.p.type || !a.sh.size || !b.sh.size) continue;
  let inter = 0; for (const x of a.sh) if (b.sh.has(x)) inter++;
  const jac = inter / (a.sh.size + b.sh.size - inter);
  const pct = Math.round(jac * 100);
  if (jac >= OVERLAP.error) E(b.p.path, 'location-template', `${pct}% of the copy overlaps ${a.p.path} once place names are removed (limit ${Math.round(OVERLAP.error * 100)}%): write this page from its own angle`);
  else if (jac >= OVERLAP.warn) W(b.p.path, 'location-template', `${pct}% of the copy overlaps ${a.p.path} once place names are removed: make it more specific to this place and audience`);
}

// Human fact-check sign-off per copy file (Google, Oct 2026: AI-assisted content is fact-checked by a person).
const unchecked = [];
for (const p of pages) {
  const copy = p.reg?.copy;
  if (!copy || /noindex/.test(p.robots)) continue;
  const fc = copy.factCheck;
  if (!fc?.by || !fc?.date || (copy.updated && fc.date < copy.updated)) unchecked.push(p.path);
}
if (unchecked.length) W('/', 'fact-check', `${unchecked.length} page(s) have no human fact-check after their last edit (add "factCheck": { "by": "<name>", "date": "YYYY-MM-DD" } once a person has checked every fact, title, meta description and alt text): ${unchecked.slice(0, 5).join(', ')}${unchecked.length > 5 ? ', ...' : ''}`);

// sitemap, robots, llms.txt
const sitemapFile = join(DIST, 'sitemap.xml');
if (!existsSync(sitemapFile)) E('/sitemap.xml', 'sitemap', 'sitemap.xml missing');
else {
  const locs = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const p of pages) {
    const noindex = /noindex/.test(p.robots);
    if (!noindex && !locs.includes(p.path)) E(p.path, 'sitemap', 'indexable page missing from sitemap.xml');
    if (noindex && locs.includes(p.path)) E(p.path, 'sitemap', 'noindex page listed in sitemap.xml');
  }
  for (const l of locs) if (!existingPaths.has(l)) E(l, 'sitemap', 'sitemap lists a URL that was not built');
}
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots) E('/robots.txt', 'robots', 'robots.txt missing');
for (const bot of ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Bingbot', 'Googlebot']) {
  if (new RegExp(`User-agent: ${bot}\\s*\\nDisallow: /\\s*\\n`).test(robots)) E('/robots.txt', 'robots-ai', `${bot} is blocked (AI answer engines must be able to read the site)`);
}
if (/User-agent: \*\s*\nDisallow: \/\s*\n/.test(robots)) E('/robots.txt', 'robots', 'the whole site is disallowed');
if (!existsSync(join(DIST, 'llms.txt'))) E('/llms.txt', 'llms', 'llms.txt missing');

// redirects
const froms = new Set(redirects.map(([f]) => f));
for (const [from, to] of redirects) {
  if (existingPaths.has(from)) E(from, 'redirect', 'redirect source is also a live page');
  if (to.startsWith('/') && !existingPaths.has(to)) E(from, 'redirect', `redirect target ${to} does not exist`);
  if (froms.has(to)) E(from, 'redirect', `redirect chain ${from} -> ${to} -> ... (point at the final URL)`);
}

// URL standard: no navigation words below the hubs
for (const p of pages) {
  const segs = p.path.split('/').filter(Boolean);
  if (segs.length > 1 && ['services', 'service-area', 'service-areas', 'locations'].includes(segs[0])) E(p.path, 'url-standard', 'navigation word in a page URL below its hub');
}

// ---------- report ----------
const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');
const infos = issues.filter((i) => i.level === 'info');
writeFileSync(join(ROOT, '.seo-report.json'), JSON.stringify({ checkedAt: new Date().toISOString(), pages: pages.length, errors, warnings: warns, notes: infos }, null, 2));
const group = (list) => list.reduce((acc, i) => ((acc[i.page] ??= []).push(`[${i.rule}] ${i.msg}`), acc), {});
console.log(`\nSEO gate: checked ${pages.length} pages.`);
if (warns.length) {
  console.log(`\n⚠ ${warns.length} warning(s) (do not block deploy):`);
  for (const [page, msgs] of Object.entries(group(warns))) { console.log(`  ${page}`); msgs.forEach((m) => console.log(`    - ${m}`)); }
}
if (errors.length) {
  console.error(`\n✖ ${errors.length} error(s). Deploy blocked until fixed:`);
  for (const [page, msgs] of Object.entries(group(errors))) { console.error(`  ${page}`); msgs.forEach((m) => console.error(`    - ${m}`)); }
  console.error('');
  process.exit(1);
}
console.log('\n✔ SEO gate passed.\n');
