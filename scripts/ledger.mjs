#!/usr/bin/env node
// Change ledger: every page the monthly growth cycle creates or changes, with the numbers
// before the change and checks at 30, 60 and 90 days, so each run learns what worked.
// File: docs/growth/ledger.json   Playbook: docs/monthly-growth.md (steps 1 and 9)
//
// Usage: node scripts/ledger.mjs --due [YYYY-MM-DD]   checks due by that date (default today)
//        node scripts/ledger.mjs --locked [YYYY-MM-DD] pages changed in the last 60 days (leave them alone)
//        node scripts/ledger.mjs --summary              outcomes so far, by kind of change

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent } from '../src/lib/content.mjs';

const FILE = join(process.cwd(), 'docs', 'growth', 'ledger.json');
const CHECKS = [30, 60, 90];
const LOCK_DAYS = 60;
const args = process.argv.slice(2);
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const today = dateArg ?? loadContent().today;
const ledger = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : { changes: [] };
const changes = ledger.changes ?? [];
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

if (args.includes('--due')) {
  const due = [];
  for (const c of changes) {
    for (const day of CHECKS) {
      const at = addDays(c.live, day);
      if (at <= today && !(c.checks ?? []).some((k) => k.day === day)) due.push({ ...c, day, at });
    }
  }
  if (!due.length) console.log(`No ledger checks due by ${today}.`);
  for (const d of due) console.log(`${d.at}  day ${d.day}  ${d.kind.padEnd(10)} ${d.path}  (${d.keyword ?? 'no keyword'}; live ${d.live}; baseline ${d.baseline.clicks ?? 0} clicks, ${d.baseline.impressions ?? 0} impressions, position ${d.baseline.position ?? 'none'})`);
} else if (args.includes('--locked')) {
  const last = new Map();
  for (const c of changes) if (c.kind !== 'tech' && (!last.get(c.path) || c.live > last.get(c.path))) last.set(c.path, c.live);
  const locked = [...last].filter(([, d]) => addDays(d, LOCK_DAYS) > today).sort((a, b) => a[1].localeCompare(b[1]));
  if (!locked.length) console.log('No page is locked.');
  for (const [p, d] of locked) console.log(`${p}  changed ${d}, locked until ${addDays(d, LOCK_DAYS)}`);
} else if (args.includes('--summary')) {
  const by = {};
  for (const c of changes) {
    const k = (c.checks ?? []).sort((a, b) => b.day - a.day)[0];
    const v = k?.verdict ?? 'pending';
    (by[c.kind] ??= {})[v] = ((by[c.kind] ??= {})[v] ?? 0) + 1;
  }
  if (!changes.length) console.log('The ledger is empty.');
  for (const [kind, v] of Object.entries(by)) console.log(`${kind}: ${Object.entries(v).map(([a, n]) => `${n} ${a}`).join(', ')}`);
} else {
  console.log('Usage: node scripts/ledger.mjs --due | --locked | --summary [YYYY-MM-DD]');
}
