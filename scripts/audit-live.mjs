#!/usr/bin/env node
// Live technical audit: crawls the deployed site the way a search engine does and reports
// what the build gate cannot see (server status codes, redirects as served, response
// headers, robots.txt, the sitemap against the real crawl, outbound links, page weight).
// Agency tool, replaces third-party site audits (Artem 3 Nov 2026).
//
// Usage: node scripts/audit-live.mjs [base-url] [--max 500] [--strict]
//   base-url  defaults to site.url; pass the pages.dev address to audit a preview
//   --strict  exit 1 when an error is found (CI)
// Writes .audit-live.json (every finding) and audit-live.md (summary for the monthly run).
// Needs network: runs in GitHub Actions (.github/workflows/live-audit.yml), not in the build.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { loadContent } from '../src/lib/content.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const { site } = loadContent();
const BASE = new URL(args.find((a) => /^https?:\/\//.test(a)) ?? site.url);
const BASE_ORIGIN = BASE.origin;
const SITE_HOST = new URL(site.url).host;
const STAGING = BASE.host !== SITE_HOST; // auditing a preview: canonicals and noindex differ on purpose
const MAX = Number(opt('--max', 500));
const UA = 'Mozilla/5.0 (compatible; IZY-site-audit/1.0; +https://prosbuddy.com)';

const issues = [];
const add = (level, rule, url, msg) => issues.push({ level, rule, url, msg });
const E = (r, u, m) => add('error', r, u, m);
const W = (r, u, m) => add('warn', r, u, m);
const N = (r, u, m) => add('note', r, u, m); // expected or informational

const toBase = (u) => { const x = new URL(u, BASE_ORIGIN); return x.host === SITE_HOST || x.host === BASE.host ? BASE_ORIGIN + x.pathname + x.search : x.href; };
const isInternal = (u) => { try { const x = new URL(u, BASE_ORIGIN); return x.host === BASE.host || x.host === SITE_HOST; } catch { return false; } };
const pathOf = (u) => new URL(u, BASE_ORIGIN).pathname;

async function get(url, { method = 'GET', redirect = 'manual' } = {}) {
  try {
    const res = await fetch(url, { method, redirect, signal: AbortSignal.timeout(20000), headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' } });
    const body = method === 'GET' && (res.headers.get('content-type') ?? '').match(/text|xml|json/) ? await res.text() : '';
    return { status: res.status, headers: res.headers, location: res.headers.get('location'), body };
  } catch (e) {
    return { status: e.name === 'TimeoutError' ? 'timeout' : 'error', error: e.message, headers: new Headers(), body: '' };
  }
}

// Follow redirects one hop at a time so chains are visible.
async function resolve(url) {
  const hops = [];
  let cur = url;
  for (let i = 0; i < 6; i++) {
    const r = await get(cur);
    if (typeof r.status === 'number' && r.status >= 300 && r.status < 400 && r.location) {
      hops.push({ url: cur, status: r.status });
      cur = new URL(r.location, cur).href;
      continue;
    }
    return { final: cur, res: { ...r, url: cur }, hops };
  }
  return { final: cur, res: { status: 'redirect-loop', headers: new Headers(), body: '' }, hops };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

// ---------- robots.txt, sitemap, llms.txt, headers ----------
const robots = await get(`${BASE_ORIGIN}/robots.txt`);
if (robots.status !== 200) E('robots', '/robots.txt', `robots.txt returned ${robots.status}`);
else {
  const groups = robots.body.split(/\n\s*\n/);
  for (const g of groups) {
    const agents = [...g.matchAll(/^user-agent:\s*(.+)$/gim)].map((m) => m[1].trim().toLowerCase());
    if ((agents.includes('*') || agents.includes('googlebot') || agents.includes('bingbot')) && /^disallow:\s*\/\s*$/im.test(g)) E('robots', '/robots.txt', `robots.txt blocks ${agents.join(', ')} from the whole site`);
  }
  if (!/^sitemap:/im.test(robots.body)) W('robots', '/robots.txt', 'robots.txt has no Sitemap line');
}
const llms = await get(`${BASE_ORIGIN}/llms.txt`);
if (llms.status !== 200) W('llms', '/llms.txt', `llms.txt returned ${llms.status}`);

// Sitemap: the robots.txt Sitemap line, else /sitemap.xml; follows redirects and sitemap indexes.
const smStart = robots.body?.match(/^sitemap:\s*(\S+)/im)?.[1] ?? `${BASE_ORIGIN}/sitemap.xml`;
const sitemapUrls = [];
async function readSitemap(url, depth = 0) {
  const { res, hops } = await resolve(toBase(url));
  if (hops.length && depth === 0) N('sitemap', pathOf(url), `sitemap redirects (${hops.length} hop) to ${pathOf(res.url ?? url)}`);
  if (res.status !== 200) { E('sitemap', pathOf(url), `sitemap returned ${res.status}`); return; }
  const locs = [...res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(res.body) && depth < 2) { for (const l of locs) await readSitemap(l, depth + 1); return; }
  sitemapUrls.push(...locs.map(toBase));
}
await readSitemap(smStart);
if (!sitemapUrls.length) E('sitemap', pathOf(smStart), 'the sitemap lists no URLs');

const home = await get(`${BASE_ORIGIN}/`);
// Unreachable (DNS, network, firewall, timeout): report that, never a crawl of nothing.
if (typeof home.status !== 'number') {
  const msg = `# Live technical audit: ${BASE.host}\n\n**Unreachable:** ${BASE_ORIGIN}/ returned ${home.status} (${home.error ?? 'no response'}). Nothing was audited. Check the address (AUDIT_BASE_URL or site.url) and that the runner can reach it.\n`;
  writeFileSync(join(ROOT, 'audit-live.md'), msg);
  writeFileSync(join(ROOT, '.audit-live.json'), JSON.stringify({ base: BASE_ORIGIN, unreachable: true, status: home.status, error: home.error, checkedAt: new Date().toISOString(), errors: 1, issues: [{ level: 'error', rule: 'unreachable', url: '/', msg: `returned ${home.status}` }] }, null, 2));
  console.log(msg);
  process.exit(flag('--strict') ? 1 : 0);
}
// Before launch the client domain still serves the old site: this build's pages carry
// <meta name="build-id">. Without it, the audit is a baseline of the old site and the
// planned redirects (content/redirects.json) are not expected to work yet.
const OUR_BUILD = /<meta name="build-id"/.test(home.body);
if (!OUR_BUILD) N('old-site', '/', 'this address does not serve the starter build yet (old site): a pre-launch baseline; planned redirects are not checked');
const hsts = home.headers.get('strict-transport-security');
if (BASE.protocol === 'https:' && !hsts) (STAGING ? N : W)('hsts', '/', 'no Strict-Transport-Security header');
const http = BASE.protocol === 'https:' ? await get(`http://${BASE.host}/`) : { status: 'skipped' };
if (BASE.protocol === 'https:' && typeof http.status === 'number' && !(http.status >= 300 && http.status < 400 && /^https:/.test(http.location ?? ''))) E('https', '/', `http:// returned ${http.status} instead of a redirect to https://`);
if (!STAGING) {
  const altHost = BASE.host.startsWith('www.') ? BASE.host.slice(4) : `www.${BASE.host}`;
  const alt = await get(`https://${altHost}/`);
  if (typeof alt.status === 'number' && alt.status === 200) E('host', `https://${altHost}/`, `${altHost} serves the site too (duplicate host): 301 it to ${BASE.host}`);
  if (alt.status === 'error' || alt.status === 'timeout') N('host', `https://${altHost}/`, `${altHost} does not resolve (fine if nobody links to it)`);
}

// ---------- old URLs must 301 to their new pages ----------
const manual = OUR_BUILD && existsSync(join(ROOT, 'content', 'redirects.json')) ? JSON.parse(readFileSync(join(ROOT, 'content', 'redirects.json'), 'utf8')).filter((r) => r.from) : [];
await pool(manual, 6, async (r) => {
  const { final, res, hops } = await resolve(BASE_ORIGIN + r.from);
  if (!hops.length) E('redirect', r.from, `old URL returns ${res.status} instead of a 301 to ${r.to}`);
  else if (hops[0].status !== 301 && hops[0].status !== 308) W('redirect', r.from, `redirect is ${hops[0].status}, use 301`);
  if (hops.length > 1) W('redirect-chain', r.from, `${hops.length} hops before ${pathOf(final)} (point straight at the final URL)`);
  if (hops.length && pathOf(final) !== r.to) E('redirect', r.from, `lands on ${pathOf(final)}, expected ${r.to}`);
  if (hops.length && res.status !== 200) E('redirect', r.from, `target ${pathOf(final)} returns ${res.status}`);
});

// ---------- crawl ----------
const seen = new Map(); // path -> record
const queue = [`${BASE_ORIGIN}/`, ...sitemapUrls];
const inbound = new Map(); // path -> Set of linking pages
const outbound = new Map(); // external url -> Set of pages
const crawlLinks = [];

while (queue.length && seen.size < MAX) {
  const batch = [...new Set(queue.splice(0, 8))].filter((u) => !seen.has(pathOf(u)));
  await pool(batch, 8, async (url) => {
    const p = pathOf(url);
    if (seen.has(p)) return;
    const { final, res, hops } = await resolve(url);
    const rec = { path: p, status: res.status, hops: hops.length, final: pathOf(final) };
    seen.set(p, rec);
    if (hops.length) { rec.redirect = true; return; }
    if (res.status !== 200) return;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) return;
    const root = parse(res.body, { comment: false });
    const xrobots = res.headers.get('x-robots-tag') ?? '';
    const mrobots = root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
    rec.noindex = /noindex/i.test(xrobots + ' ' + mrobots);
    rec.noindexHeader = /noindex/i.test(xrobots);
    rec.title = (root.querySelector('head > title') ?? root.querySelector('title'))?.text.trim() ?? '';
    rec.description = root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
    rec.canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
    rec.h1 = root.querySelectorAll('h1').length;
    rec.bytes = Buffer.byteLength(res.body);
    const body = parse(root.querySelector('body')?.toString() ?? '');
    body.querySelectorAll('script, style, svg, noscript, template').forEach((n) => n.remove());
    rec.ratio = body.text.replace(/\s+/g, ' ').trim().length / res.body.length;
    rec.imgNoAlt = root.querySelectorAll('img').filter((i) => !i.hasAttribute('alt')).length;
    rec.mixed = (res.body.match(/(?:src|href)="http:\/\/[^"]+"/g) ?? []).filter((m) => !/http:\/\/(www\.)?w3\.org/.test(m)).length;
    rec.schemaInvalid = root.querySelectorAll('script[type="application/ld+json"]').filter((s) => { try { JSON.parse(s.text); return false; } catch { return true; } }).length;
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || /^(#|tel:|mailto:|sms:|javascript:)/i.test(href)) continue;
      if (isInternal(href)) {
        const t = toBase(href);
        const tp = pathOf(t);
        if (tp !== p) (inbound.get(tp) ?? inbound.set(tp, new Set()).get(tp)).add(p);
        crawlLinks.push({ from: p, to: tp });
        if (!seen.has(tp)) queue.push(t);
      } else if (/^https?:\/\//.test(href) && a.closest('main')) {
        (outbound.get(href) ?? outbound.set(href, new Set()).get(href)).add(p);
      }
    }
  });
}

const pages = [...seen.values()];
const html = pages.filter((r) => r.status === 200 && !r.redirect && r.title !== undefined);
const indexable = html.filter((r) => !r.noindex);

for (const r of pages) {
  if (r.redirect) continue;
  if (r.status !== 200) E('status', r.path, `returns ${r.status}`);
}
// Internal links that hit redirects or errors
const linkTargets = new Map();
for (const l of crawlLinks) (linkTargets.get(l.to) ?? linkTargets.set(l.to, new Set()).get(l.to)).add(l.from);
for (const [to, froms] of linkTargets) {
  const r = seen.get(to);
  if (!r) continue;
  const where = [...froms].slice(0, 3).join(', ') + (froms.size > 3 ? ` +${froms.size - 3} more` : '');
  if (r.redirect) W('link-to-redirect', to, `linked from ${where} but redirects to ${r.final}: link the final URL`);
  else if (r.status !== 200) E('broken-link', to, `linked from ${where} but returns ${r.status}`);
}

for (const r of html) {
  const expected = new URL(r.path, site.url).href;
  if (r.noindexHeader && STAGING) N('noindex', r.path, 'X-Robots-Tag noindex (expected on the preview host)');
  else if (r.noindex && sitemapUrls.some((u) => pathOf(u) === r.path)) E('noindex-in-sitemap', r.path, 'noindex page is listed in the sitemap');
  else if (r.noindex) N('noindex', r.path, 'noindex (check it is meant to be)');
  if (!r.noindex || STAGING) {
    if (!r.title) E('title', r.path, 'no <title>');
    else if (r.title.length > 60) W('title-length', r.path, `title is ${r.title.length} characters`);
    if (!r.description) E('description', r.path, 'no meta description');
    if (r.h1 !== 1) E('h1', r.path, `${r.h1} H1 tags`);
    if (r.canonical !== expected) E('canonical', r.path, `canonical "${r.canonical}" (expected ${expected})`);
    if (r.ratio < 0.1) W('text-html-ratio', r.path, `text is ${(Math.floor(r.ratio * 1000) / 10).toFixed(1)}% of the HTML`);
    if (r.bytes > 150 * 1024) W('page-weight', r.path, `HTML is ${Math.round(r.bytes / 1024)} KB`);
    if (r.imgNoAlt) E('img-alt', r.path, `${r.imgNoAlt} image(s) without alt`);
    if (r.mixed) E('mixed-content', r.path, `${r.mixed} http:// resource(s) on an https page`);
    if (r.schemaInvalid) E('schema', r.path, `${r.schemaInvalid} JSON-LD block(s) do not parse`);
  }
}
// Duplicate titles and descriptions as served
for (const field of ['title', 'description']) {
  const by = new Map();
  for (const r of indexable.length ? indexable : html) if (r[field]) (by.get(r[field]) ?? by.set(r[field], []).get(r[field])).push(r.path);
  for (const [v, ps] of by) if (ps.length > 1) E(`duplicate-${field}`, ps[0], `same ${field} on ${ps.join(', ')}`);
}
// Link graph: orphans and pages reached from one page
const auditSet = STAGING ? html : indexable;
for (const r of auditSet) {
  if (r.path === '/') continue;
  const n = inbound.get(r.path)?.size ?? 0;
  if (!n) W('orphan', r.path, 'no crawled page links here (found only through the sitemap)');
  else if (n === 1) W('one-incoming-link', r.path, `only ${[...inbound.get(r.path)][0]} links here`);
}
// Sitemap against the crawl
for (const u of sitemapUrls) {
  const r = seen.get(pathOf(u));
  if (r?.redirect) E('sitemap', pathOf(u), `listed in the sitemap but redirects to ${r.final}`);
  else if (r && r.status !== 200) E('sitemap', pathOf(u), `listed in the sitemap but returns ${r.status}`);
}
const inSitemap = new Set(sitemapUrls.map(pathOf));
for (const r of auditSet) if (!inSitemap.has(r.path) && !r.noindex) W('sitemap', r.path, 'indexable page missing from the sitemap');

// Outbound links
const BLOCKED = new Set([401, 403, 429]);
const SKIP = /^(https?:\/\/)?(www\.)?(facebook|instagram|linkedin|x|twitter|yelp|tiktok|nextdoor)\.com|maps\.google\.com|google\.com\/maps|search\.google\.com/i;
await pool([...outbound.keys()].filter((u) => !SKIP.test(u)), 6, async (u) => {
  let r = await get(u, { method: 'HEAD', redirect: 'follow' });
  if (typeof r.status !== 'number' || r.status >= 400) r = await get(u, { redirect: 'follow' });
  const on = [...outbound.get(u)].slice(0, 3).join(', ');
  if (BLOCKED.has(r.status)) N('outbound-blocked', u, `${r.status}: the site blocks bots, check by hand (on ${on})`);
  else if (typeof r.status !== 'number' || r.status >= 400) E('outbound-broken', u, `returns ${r.status} (on ${on})`);
});

// ---------- report ----------
const count = (l) => issues.filter((i) => i.level === l).length;
const report = {
  base: BASE_ORIGIN, staging: STAGING, checkedAt: new Date().toISOString(),
  crawled: pages.length, htmlPages: html.length, indexable: indexable.length, sitemapUrls: sitemapUrls.length, outboundLinks: outbound.size,
  errors: count('error'), warnings: count('warn'), notes: count('note'), issues,
};
writeFileSync(join(ROOT, '.audit-live.json'), JSON.stringify(report, null, 2));

const byRule = (level) => {
  const g = {};
  for (const i of issues.filter((x) => x.level === level)) (g[i.rule] ??= []).push(i);
  return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
};
const lines = [
  `# Live technical audit: ${BASE.host}`,
  '',
  `${new Date().toISOString().slice(0, 10)} · ${OUR_BUILD ? '' : 'old site (pre-launch baseline) · '}${html.length} pages crawled (${indexable.length} indexable) · ${sitemapUrls.length} in the sitemap · ${outbound.size} outbound links${STAGING ? ' · preview host: canonicals and noindex point at the client domain on purpose' : ''}`,
  '',
  `**${report.errors} errors · ${report.warnings} warnings · ${report.notes} notes**`,
];
for (const [level, label] of [['error', 'Errors'], ['warn', 'Warnings'], ['note', 'Notes (expected or to check by hand)']]) {
  const groups = byRule(level);
  if (!groups.length) continue;
  lines.push('', `## ${label}`);
  for (const [rule, list] of groups) {
    lines.push('', `**${rule}** (${list.length})`);
    for (const i of list.slice(0, 25)) lines.push(`- \`${i.url}\` ${i.msg}`);
    if (list.length > 25) lines.push(`- ... ${list.length - 25} more in .audit-live.json`);
  }
}
writeFileSync(join(ROOT, 'audit-live.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exit(flag('--strict') && report.errors ? 1 : 0);
