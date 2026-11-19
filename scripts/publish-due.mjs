#!/usr/bin/env node
// Scheduled publishing, step 2 of 2 (step 1 is "publishDate" in a copy file or a future
// blog post date, see src/lib/content.mjs). The daily workflow runs this to find the pages
// whose publish date is today, rebuilds the site when there are any, and then pings IndexNow.
//
// Usage: node scripts/publish-due.mjs            list today's pages (sets due/paths for GitHub Actions)
//        node scripts/publish-due.mjs --wait     poll the live site until today's pages return 200 (15 min)
//        node scripts/publish-due.mjs --upcoming list everything still scheduled

import { appendFileSync } from 'node:fs';
import { loadContent, noindexFor } from '../src/lib/content.mjs';

const { site, pages, today } = loadContent();
const dateOf = (p) => (p.type === 'blog-post' ? p.copy?.date : p.copy?.publishDate);
const due = pages.filter((p) => p.live && String(dateOf(p) ?? '') === today && !noindexFor(p));
const upcoming = pages.filter((p) => p.scheduled).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
// Due but not published: no fact-check after the last edit (see factChecked in src/lib/content.mjs).
const held = pages.filter((p) => p.held).sort((a, b) => a.held.localeCompare(b.held));

if (process.argv.includes('--upcoming')) {
  console.log(upcoming.length ? upcoming.map((p) => `${p.scheduled}  ${p.path}`).join('\n') : 'Nothing scheduled.');
  if (held.length) console.log(`Held for a fact-check:\n${held.map((p) => `${p.held}  ${p.path}`).join('\n')}`);
  process.exit(0);
}

if (process.argv.includes('--wait')) {
  const deadline = Date.now() + 15 * 60 * 1000;
  const pending = new Set(due.map((p) => new URL(p.path, site.url).href));
  while (pending.size && Date.now() < deadline) {
    for (const u of [...pending]) {
      try { if ((await fetch(u, { headers: { 'cache-control': 'no-cache' } })).status === 200) pending.delete(u); } catch {}
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 30000));
  }
  if (pending.size) { console.error(`Not live after 15 minutes: ${[...pending].join(', ')}`); process.exit(1); }
  console.log('All of today\'s pages are live.');
  process.exit(0);
}

console.log(`Today (${today}, ${site.timezone || 'UTC'}): ${due.length ? due.map((p) => p.path).join(', ') : 'nothing to publish'}.`);
if (upcoming.length) console.log(`Next: ${upcoming[0].scheduled} ${upcoming[0].path} (${upcoming.length} scheduled).`);
if (held.length) console.log(`Held for a fact-check: ${held.map((p) => `${p.path} (due ${p.held})`).join(', ')}.`);
if (process.env.GITHUB_OUTPUT && held.length) {
  const rel = (f) => f.replace(process.cwd() + '/', '');
  const body = [
    'These pages reached their publish date but stay unpublished until a person fact-checks them.',
    '',
    'For each page: check every fact against the client files, then the title, meta description, schema and alt text. Then add `"factCheck": { "by": "<your name>", "date": "YYYY-MM-DD" }` to its copy file in a pull request. It goes live when that is merged.',
    '',
    ...held.map((p) => `- [ ] \`${p.path}\` due ${p.held}: \`${rel(p.copyFile)}\``),
  ].join('\n');
  appendFileSync(process.env.GITHUB_OUTPUT, `held=true\nheld_body<<EOF_HELD\n${body}\nEOF_HELD\n`);
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `due=${due.length ? 'true' : 'false'}\npaths=${['/', ...due.map((p) => p.path)].join(',')}\n`);
