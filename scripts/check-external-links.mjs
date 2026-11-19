#!/usr/bin/env node
// Verifies every outbound link on the built site still resolves (blog sources go
// stale). Needs network, so it runs as its own CI step, not inside `npm run build`.
// Run after a build: npm run links:external

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { loadContent } from '../src/lib/content.mjs';

const DIST = join(process.cwd(), 'dist');
if (!existsSync(DIST)) { console.error('✖ dist/ not found. Build first.'); process.exit(1); }
const host = new URL(loadContent().site.url).host;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const SKIP = /^(https?:\/\/)?(www\.)?(facebook|instagram|linkedin|x|twitter|yelp)\.com|maps\.google\.com/i; // block bots, checked by hand

const links = new Map();
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  for (const a of parse(readFileSync(file, 'utf8')).querySelectorAll('main a[href^="http"]')) {
    const href = a.getAttribute('href');
    if (new URL(href).host === host || SKIP.test(href)) continue;
    (links.get(href) ?? links.set(href, new Set()).get(href)).add(page);
  }
}

const check = async (url) => {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; IZY-link-check)' } });
      if (res.status < 400) return { ok: true, status: res.status };
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (e) {
      if (method === 'GET') return { ok: false, status: e.name === 'TimeoutError' ? 'timeout' : e.message };
    }
  }
};

// 401/403/429 mean the site blocks automated checks (Cloudflare, Akamai), not that the
// page is gone: they are listed to check by hand and do not fail the step
// (approved by Artem, 28 Oct 2026). 404, 410, 5xx and timeouts still fail.
const BLOCKED = new Set([401, 403, 429]);
let bad = 0, blocked = 0;
for (const [url, pages] of links) {
  const r = await check(url);
  if (r.ok) console.log(`✔ ${r.status}  ${url}`);
  else if (BLOCKED.has(r.status)) { blocked++; console.warn(`⚠ ${r.status} (blocks bots, check by hand)  ${url}  (on ${[...pages].join(', ')})`); }
  else { bad++; console.error(`✖ ${r.status}  ${url}  (on ${[...pages].join(', ')})`); }
}
console.log(`\nExternal links: ${links.size} checked, ${bad} broken, ${blocked} blocked for bots (check by hand).`);
process.exit(bad ? 1 : 0);
