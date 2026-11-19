#!/usr/bin/env node
// Google Search Console through the agency service account (the same GOOGLE_SA_KEY as the
// Drive import). Setup: docs/search-console.md.
//
// Usage:
//   GOOGLE_SA_KEY='<json>' node scripts/gsc.mjs submit [--wait <sha>]
//       Submits /sitemap.xml. With --wait, first checks that the client's domain serves this
//       build (<meta name="build-id">); while the domain still shows the old site it skips.
//   GOOGLE_SA_KEY='<json>' node scripts/gsc.mjs index-report [--out <file>]
//       Asks the URL Inspection API about every live, indexable page and lists the ones Google
//       has not indexed, for a person to "Request indexing" by hand (Google offers no API for
//       that on normal sites). Quota: 2,000 inspections a day per property.
// Property: site.searchConsoleProperty in site.json ("sc-domain:example.com" or
// "https://example.com/"); without it both forms are tried.

import { createSign } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { loadContent, livePages, noindexFor } from '../src/lib/content.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const { site } = loadContent();
const abs = (p) => new URL(p, site.url).href;

if (!['submit', 'index-report'].includes(cmd)) {
  console.error('Usage: node scripts/gsc.mjs submit [--wait <sha>] | index-report [--out <file>]');
  process.exit(1);
}
if (!process.env.GOOGLE_SA_KEY) {
  console.log('Search Console: GOOGLE_SA_KEY not set, skipping (docs/search-console.md).');
  process.exit(0);
}
let key;
try { key = JSON.parse(process.env.GOOGLE_SA_KEY); } catch { throw new Error('GOOGLE_SA_KEY is not valid JSON (paste the whole service account key file).'); }

const b64url = (s) => Buffer.from(s).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${head}.${claims}`);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${b64url(signer.sign(key.private_key))}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).access_token;
}

const host = new URL(site.url).host.replace(/^www\./, '');
const candidates = site.searchConsoleProperty ? [site.searchConsoleProperty] : [`sc-domain:${host}`, new URL('/', site.url).href];
const auth = { authorization: `Bearer ${await token()}` };

async function property() {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: auth });
  if (!res.ok) throw new Error(`Search Console API (${res.status}): ${(await res.text()).slice(0, 300)}. Is the Search Console API enabled in the service account's Cloud project?`);
  const mine = (await res.json()).siteEntry ?? [];
  const hit = candidates.map((c) => mine.find((s) => s.siteUrl === c)).find(Boolean);
  if (!hit) {
    console.log(`Search Console: ${key.client_email} has no access to ${candidates.join(' or ')}. Add it as a Full user (Settings > Users and permissions), see docs/search-console.md. Skipping.`);
    process.exit(0);
  }
  if (hit.permissionLevel === 'siteUnverifiedUser') { console.log(`Search Console: ${hit.siteUrl} is not verified. Skipping.`); process.exit(0); }
  return hit;
}

if (cmd === 'submit') {
  // Check access first, so every run's log shows whether the property is set up.
  const prop = await property();
  console.log(`Search Console: access to ${prop.siteUrl} as ${prop.permissionLevel}.`);
  const sha = opt('--wait');
  if (sha) {
    // Up to 15 minutes for Cloudflare to serve this commit on the client's domain. Before
    // launch the domain shows the old site, so this skips instead of failing.
    let live = false;
    for (let i = 0; i < 45 && !live; i++) {
      try { live = (await (await fetch(abs('/'), { headers: { 'cache-control': 'no-cache' } })).text()).includes(`name="build-id" content="${sha}"`); } catch {}
      if (!live) await new Promise((r) => setTimeout(r, 20000));
    }
    if (!live) { console.log(`Search Console: ${site.url} does not serve this build (not launched yet, or still deploying). Sitemap not submitted.`); process.exit(0); }
  }
  if (!['siteOwner', 'siteFullUser'].includes(prop.permissionLevel)) { console.log(`Search Console: ${key.client_email} is a ${prop.permissionLevel}; submitting a sitemap needs a Full user. Skipping.`); process.exit(0); }
  const feed = abs('/sitemap.xml');
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop.siteUrl)}/sitemaps/${encodeURIComponent(feed)}`, { method: 'PUT', headers: auth });
  if (!res.ok) throw new Error(`Sitemap submit failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  console.log(`Search Console: submitted ${feed} to ${prop.siteUrl}.`);
}

if (cmd === 'index-report') {
  const prop = await property();
  const urls = livePages().filter((p) => !noindexFor(p)).map((p) => abs(p.path));
  const rows = [];
  for (const url of urls.slice(0, 2000)) {
    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ inspectionUrl: url, siteUrl: prop.siteUrl }),
    });
    if (!res.ok) { rows.push({ url, verdict: 'ERROR', state: `${res.status}` }); continue; }
    const r = (await res.json()).inspectionResult?.indexStatusResult ?? {};
    rows.push({ url, verdict: r.verdict ?? 'UNKNOWN', state: r.coverageState ?? '', crawled: r.lastCrawlTime?.slice(0, 10) ?? 'never' });
  }
  const missing = rows.filter((r) => r.verdict !== 'PASS');
  const lines = [`# Index report ${new Date().toISOString().slice(0, 10)}`, '', `${urls.length} live indexable pages, ${rows.length - missing.length} indexed, ${missing.length} not indexed.`, ''];
  if (missing.length) {
    lines.push('Request indexing by hand in Search Console (URL Inspection > Request indexing, about 10 a day), most important first:', '', '| URL | Status | Last crawl |', '|---|---|---|');
    for (const r of missing) lines.push(`| ${r.url} | ${r.state || r.verdict} | ${r.crawled ?? ''} |`);
  }
  const out = lines.join('\n') + '\n';
  if (opt('--out')) writeFileSync(opt('--out'), out);
  console.log(out);
}
