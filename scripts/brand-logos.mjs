#!/usr/bin/env node
// Fills public/brand-logos/ with logos for the brands in site.brandsWeRepair, from the
// open Simple Icons set (simpleicons.org, CC0; each logo stays its owner's trademark and
// is used only to name the brands the client repairs, next to the independence note).
// Brands that are not in the set keep their icon tile until a logo file is added by hand
// as public/brand-logos/<brand-slug>.svg|png|webp (for example from the client's own
// current site). Existing files are never overwritten (delete one to regenerate it). Run: npm run brand-logos
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as icons from 'simple-icons';
import { svgPathBbox } from 'svg-path-bbox';
import { loadContent } from '../src/lib/content.mjs';

const { site } = loadContent();
const dir = join(process.cwd(), 'public', 'brand-logos');
mkdirSync(dir, { recursive: true });
const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Names a client writes differently from the Simple Icons title.
const ALIAS = { ge: 'General Electric', 'general electric': 'General Electric' };
const all = Object.values(icons).filter((i) => i && i.title && i.svg);
const byTitle = new Map(all.map((i) => [i.title.toLowerCase(), i]));

const added = [], had = [], missing = [];
for (const b of site.brandsWeRepair ?? []) {
  const name = typeof b === 'string' ? b : b.name;
  if (typeof b === 'object' && b.logo?.src) { had.push(name); continue; }
  const s = slug(name);
  if (['svg', 'png', 'webp'].some((x) => existsSync(join(dir, `${s}.${x}`)))) { had.push(name); continue; }
  const icon = byTitle.get((ALIAS[name.toLowerCase()] ?? name).toLowerCase());
  if (!icon) { missing.push(name); continue; }
  // Crop the square 24x24 icon to the logo's own shape, so a wide wordmark fills the tile.
  const [x0, y0, x1, y1] = svgPathBbox(icon.path);
  const pad = 0.2, w = +(x1 - x0 + 2 * pad).toFixed(3), h = +(y1 - y0 + 2 * pad).toFixed(3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${+(x0 - pad).toFixed(3)} ${+(y0 - pad).toFixed(3)} ${w} ${h}" width="${Math.round((w / h) * 40)}" height="40" fill="#${icon.hex}"><title>${icon.title}</title><path d="${icon.path}"/></svg>`;
  writeFileSync(join(dir, `${s}.svg`), svg);
  added.push(name);
}
console.log(`Brand logos: ${added.length} added (${added.join(', ') || 'none'}), ${had.length} already there.`);
if (missing.length) console.log(`No open logo for: ${missing.join(', ')}. They show as icon tiles until a logo file is added to public/brand-logos/.`);
