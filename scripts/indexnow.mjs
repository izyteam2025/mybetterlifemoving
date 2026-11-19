#!/usr/bin/env node
// Pings IndexNow (Bing, Yandex, Seznam, Naver...) with the URLs that changed in the
// last commit, after the new build is live. Bing's index feeds Copilot and ChatGPT
// search, so fresh pages reach AI answers faster.
//
// Usage (CI, after deploy):  INDEXNOW_KEY=... node scripts/indexnow.mjs [--all] [--wait <sha>]
//   --all         submit every live URL instead of only changed ones
//   --paths <list> submit only these comma-separated paths (used by scheduled publishing)
//   --wait <sha>  first poll the live homepage until <meta name="build-id"> equals <sha>
//                 (the build is live), for up to 15 minutes

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { loadContent, livePages, noindexFor } from '../src/lib/content.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.log('IndexNow: INDEXNOW_KEY not set, skipping.');
  process.exit(0);
}
const { site } = loadContent();
const host = new URL(site.url).host;
const live = livePages().filter((p) => !noindexFor(p));
const abs = (p) => new URL(p, site.url).href;

const waitIdx = args.indexOf('--wait');
if (waitIdx >= 0) {
  const sha = args[waitIdx + 1];
  const deadline = Date.now() + 15 * 60 * 1000;
  let ok = false;
  let ours = false; // the domain serves a build of this site at all (has <meta name="build-id">)
  while (Date.now() < deadline) {
    try {
      const html = await (await fetch(abs('/'), { headers: { 'cache-control': 'no-cache' } })).text();
      if (html.includes(`name="build-id" content="${sha}"`)) { ok = true; break; }
      if (html.includes('name="build-id"')) ours = true;
      else { break; } // the domain still shows another site: not launched yet, nothing to wait for
    } catch {}
    await new Promise((r) => setTimeout(r, 20000));
  }
  if (!ok && !ours) {
    // Before launch the client's domain still serves the old site. Skip quietly instead of
    // failing every run until the domain is switched.
    console.log(`IndexNow: ${site.url} does not serve this site yet (not launched), not submitting.`);
    process.exit(0);
  }
  if (!ok) {
    console.error(`IndexNow: build ${sha} not live after 15 minutes, not submitting.`);
    process.exit(1);
  }
}

let urls;
const pathsIdx = args.indexOf('--paths');
if (pathsIdx >= 0) {
  // --paths /a/,/b/  submit these pages (scheduled publishing: the pages that went live today)
  urls = args[pathsIdx + 1].split(',').filter(Boolean).map(abs);
} else if (args.includes('--all')) {
  urls = live.map((p) => abs(p.path));
} else {
  let changed = [];
  try {
    changed = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    console.log('IndexNow: no git history, submitting all URLs.');
  }
  const global = changed.some((f) => /^(src\/|content\/(site|services|locations|brands|keywords|reviews|authors)\.json)/.test(f));
  if (!changed.length || global) urls = live.map((p) => abs(p.path));
  else {
    const files = new Set(changed.map((f) => join(ROOT, f)));
    urls = live.filter((p) => p.copyFile && files.has(p.copyFile)).map((p) => abs(p.path));
  }
}
if (!urls.length) {
  console.log('IndexNow: no indexable URL changed.');
  process.exit(0);
}

const body = { host, key, keyLocation: abs(`/${key}.txt`), urlList: urls.slice(0, 10000) };
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow: submitted ${body.urlList.length} URL(s), response ${res.status}.`);
if (res.status >= 400) process.exit(1);
