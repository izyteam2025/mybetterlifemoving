#!/usr/bin/env node
// Copies the client's files from their agency Google Drive folder into the site
// (agency rule, 3 Nov 2026). Runs from .github/workflows/drive-import.yml.
//
//   GOOGLE_SA_KEY='<service account JSON>' node scripts/import-drive.mjs
//   node scripts/import-drive.mjs --local <folder>   same pipeline on a local folder (tests)
//   node scripts/import-drive.mjs --dry-run          list what would be imported, write nothing
//   --root <dir>                                     write under another folder instead of the repo
//
// What it does, per file in the import folders of docs/growth/drive.json:
// - photos (JPEG, PNG, HEIC/HEIF from iPhones, WebP, TIFF, AVIF): turned upright,
//   resized to 1600 px on the long side, saved as WebP. Every bit of metadata is
//   dropped, including the GPS position iPhones record (a job photo would otherwise
//   publish the customer's address).
// - logos: raster files become clean PNGs (transparency kept, metadata dropped),
//   SVGs are copied only when they carry no script or event handlers, PDF/AI/EPS
//   are listed for a person to export.
// - licenses and certificates: images become WebP, PDFs are copied (metadata kept
//   as is, so they are listed for a check).
// - anything else (video, Google Docs, archives) is listed, never copied.
// Already imported files are skipped (docs/growth/drive-imported.json); a changed
// file is imported again to the same path.
// Writes .drive-import-report.md (the pull request body) and, under GitHub Actions,
// imported=<count> to GITHUB_OUTPUT.

import { createHash, createSign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, extname, join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const arg = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const LOCAL = arg('--local');

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
// --root <dir> writes the files, the ledger and the report under another folder (used by the self-test).
const ROOT = arg('--root') || REPO;
const CONFIG = join(REPO, 'docs/growth/drive.json');
const LEDGER = join(ROOT, 'docs/growth/drive-imported.json');
const REPORT = join(ROOT, '.drive-import-report.md');

const MAX_BYTES = 60 * 1024 * 1024;
const LONG_SIDE = 1600;
const LOGO_SIDE = 1200;

const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif', '.heic', '.heif', '.gif']);
const RASTER_MIME = /^image\/(jpeg|png|webp|tiff|avif|heic|heif|gif)$/;
const HEIC = new Set(['.heic', '.heif']);

function out(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function stop(message) {
  console.log(message);
  out('imported', 0);
  out('skipped', 'true');
  process.exit(0);
}

const norm = (name) => String(name).replace(/^\s*\d+\s*[.)_-]?\s*/, '').trim().toLowerCase();

function slug(name) {
  return basename(name, extname(name))
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

// ---------- sources: Google Drive or a local folder ----------

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function googleToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${b64url(signer.sign(key.private_key))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).access_token;
}

function driveSource(token) {
  const api = 'https://www.googleapis.com/drive/v3/files';
  const auth = { authorization: `Bearer ${token}` };
  return {
    async list(folderId) {
      const files = [];
      let pageToken = '';
      do {
        const q = new URLSearchParams({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, modifiedTime, size, webViewLink, shortcutDetails)',
          pageSize: '1000',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true',
          ...(pageToken ? { pageToken } : {}),
        });
        const res = await fetch(`${api}?${q}`, { headers: auth });
        if (!res.ok) throw new Error(`Drive list failed for ${folderId} (${res.status}): ${(await res.text()).slice(0, 300)}`);
        const body = await res.json();
        for (const f of body.files) {
          if (f.mimeType === 'application/vnd.google-apps.shortcut' && f.shortcutDetails) {
            f.id = f.shortcutDetails.targetId;
            f.mimeType = f.shortcutDetails.targetMimeType;
          }
          files.push({
            id: f.id,
            name: f.name,
            folder: f.mimeType === 'application/vnd.google-apps.folder',
            mime: f.mimeType,
            md5: f.md5Checksum || f.modifiedTime,
            modified: f.modifiedTime,
            size: Number(f.size || 0),
            link: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          });
        }
        pageToken = body.nextPageToken || '';
      } while (pageToken);
      return files;
    },
    async download(file) {
      const res = await fetch(`${api}/${file.id}?alt=media&supportsAllDrives=true`, { headers: auth });
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

function localSource(base) {
  const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.zip': 'application/zip', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.gif': 'image/gif', '.avif': 'image/avif' };
  return {
    async list(folderId) {
      const dir = folderId === 'ROOT' ? base : join(base, folderId);
      return readdirSync(dir).filter((n) => !n.startsWith('.')).map((name) => {
        const path = join(dir, name);
        const rel = relative(base, path);
        const st = statSync(path);
        const isDir = st.isDirectory();
        return {
          id: isDir ? rel : 'local-' + createHash('sha1').update(rel).digest('hex').slice(0, 16),
          name,
          folder: isDir,
          mime: isDir ? 'folder' : MIME[extname(name).toLowerCase()] || 'application/octet-stream',
          md5: isDir ? '' : createHash('md5').update(readFileSync(path)).digest('hex'),
          modified: st.mtime.toISOString(),
          size: st.size,
          link: rel,
          path,
        };
      });
    },
    async download(file) {
      return readFileSync(file.path);
    },
  };
}

// ---------- converting ----------

let sharpLib;
async function sharp() {
  if (!sharpLib) sharpLib = (await import('sharp')).default;
  return sharpLib;
}

async function decode(buffer, ext) {
  const s = await sharp();
  if (HEIC.has(ext) || /^....ftyp(heic|heix|hevc|mif1|msf1)/.test(buffer.subarray(0, 12).toString('latin1'))) {
    // sharp's bundled libvips cannot read Apple's HEVC-based HEIC, so decode it with libheif (WebAssembly).
    const heicDecode = (await import('heic-decode')).default;
    const { width, height, data } = await heicDecode({ buffer });
    return s(Buffer.from(data.buffer, data.byteOffset, data.byteLength), { raw: { width, height, channels: 4 } });
  }
  // rotate() with no angle applies the EXIF orientation, so the photo is upright once the EXIF is gone.
  return s(buffer, { animated: false }).rotate();
}

async function convert(buffer, file, kind) {
  const ext = extname(file.name).toLowerCase();
  const raster = RASTER.has(ext) || RASTER_MIME.test(file.mime);
  if (kind === 'photo' || kind === 'document') {
    if (raster) {
      const img = await decode(buffer, ext);
      const data = await img.resize({ width: LONG_SIDE, height: LONG_SIDE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 }).toBuffer();
      return { data, ext: '.webp' };
    }
    if (kind === 'document' && (ext === '.pdf' || file.mime === 'application/pdf')) {
      return { data: buffer, ext: '.pdf', note: 'PDF copied as is: check it shows nothing private before it goes on a page' };
    }
    return { skip: 'not a photo' };
  }
  if (kind === 'logo') {
    if (ext === '.svg' || file.mime === 'image/svg+xml') {
      const text = buffer.toString('utf8');
      if (/<script|\bon[a-z]+\s*=|javascript:|<foreignObject/i.test(text)) return { skip: 'SVG carries scripts or event handlers; export a clean copy' };
      return { data: buffer, ext: '.svg' };
    }
    if (raster) {
      const img = await decode(buffer, ext);
      const data = await img.resize({ width: LOGO_SIDE, height: LOGO_SIDE, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 }).toBuffer();
      return { data, ext: '.png' };
    }
    return { skip: 'vector source (PDF, AI, EPS): a person exports it to SVG' };
  }
  return { skip: `unknown kind ${kind}` };
}

// ---------- main ----------

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { files: {} };
ledger.files ||= {};

let source;
let rootId;
if (LOCAL) {
  source = localSource(LOCAL);
  rootId = 'ROOT';
} else {
  if (!config.folderId) stop('docs/growth/drive.json has no folderId yet: nothing to import.');
  if (!process.env.GOOGLE_SA_KEY) stop('GOOGLE_SA_KEY is not set: nothing to import (see docs/drive-import.md).');
  let key;
  try { key = JSON.parse(process.env.GOOGLE_SA_KEY); } catch { throw new Error('GOOGLE_SA_KEY is not valid JSON (paste the whole service account key file).'); }
  source = driveSource(await googleToken(key));
  rootId = config.folderId;
}

const importMap = new Map(Object.entries(config.import || {}).map(([name, rule]) => [norm(name), { ...rule, label: name }]));
const listOnly = new Set((config.listOnly || []).map(norm));

async function walk(folderId, depth = 0, prefix = '') {
  if (depth > 3) return [];
  const items = [];
  for (const f of await source.list(folderId)) {
    if (f.folder) items.push(...(await walk(f.id, depth + 1, `${prefix}${f.name}/`)));
    else items.push({ ...f, sub: prefix });
  }
  return items;
}

const top = await source.list(rootId);
const imported = [];
const skipped = [];
const listed = [];
const loose = [];
const unknownFolders = [];
const today = new Date().toISOString().slice(0, 10);

for (const entry of top) {
  if (!entry.folder) { loose.push(entry); continue; }
  const key = norm(entry.name);
  if (listOnly.has(key)) {
    listed.push({ folder: entry.name, files: await walk(entry.id) });
    continue;
  }
  const rule = importMap.get(key);
  if (!rule) { unknownFolders.push(entry.name); continue; }

  for (const file of await walk(entry.id)) {
    const shown = `${entry.name}/${file.sub}${file.name}`;
    const prev = ledger.files[file.id];
    if (prev && prev.md5 === file.md5) continue;
    if (file.mime.startsWith('application/vnd.google-apps')) { skipped.push({ shown, link: file.link, why: 'a Google Docs/Sheets file, not an image' }); continue; }
    if (file.mime.startsWith('video/')) { skipped.push({ shown, link: file.link, why: 'a video: it goes on the client\'s YouTube, not into the site' }); continue; }
    if (file.size > MAX_BYTES) { skipped.push({ shown, link: file.link, why: `larger than ${MAX_BYTES / 1024 / 1024} MB` }); continue; }

    let result;
    try {
      result = await convert(await source.download(file), file, rule.kind);
    } catch (err) {
      skipped.push({ shown, link: file.link, why: `could not be read (${err.message})` });
      continue;
    }
    if (result.skip) { skipped.push({ shown, link: file.link, why: result.skip }); continue; }

    const name = prev?.path ? basename(prev.path, extname(prev.path)) : `${slug(file.sub.replace(/\//g, '-') + file.name)}-${file.id.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase()}`;
    const path = `${rule.to.replace(/\/$/, '')}/${name}${result.ext}`;
    if (!DRY) {
      mkdirSync(join(ROOT, dirname(path)), { recursive: true });
      writeFileSync(join(ROOT, path), result.data);
      ledger.files[file.id] = { name: shown, md5: file.md5, modified: file.modified, path, importedOn: today };
    }
    imported.push({ shown, path, link: file.link, kb: Math.round(result.data.length / 1024), changed: Boolean(prev), note: result.note });
  }
}

if (!DRY && imported.length) mkdirSync(dirname(LEDGER), { recursive: true });
if (!DRY && imported.length) writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');

// ---------- report ----------

const lines = [];
lines.push(`## Client files from Google Drive (${today})`, '');
lines.push(imported.length
  ? `${imported.length} file${imported.length === 1 ? '' : 's'} copied into the site. Photos are WebP, 1600 px on the long side, with all metadata removed (no GPS location, no camera data).`
  : 'No new or changed files to copy.');
lines.push('');
if (imported.length) {
  lines.push('| Drive file | Saved as | Size |', '|---|---|---|');
  for (const i of imported) lines.push(`| [${i.shown}](${i.link})${i.changed ? ' (changed)' : ''} | \`${i.path}\` | ${i.kb} KB${i.note ? ` · ${i.note}` : ''} |`);
  lines.push('');
}
if (skipped.length) {
  lines.push('### Not copied', '');
  for (const s of skipped) lines.push(`- [${s.shown}](${s.link}): ${s.why}`);
  lines.push('');
}
for (const l of listed) {
  lines.push(`### In "${l.folder}" (never copied)`, '');
  if (!l.files.length) lines.push('- empty');
  for (const f of l.files) lines.push(`- [${f.sub}${f.name}](${f.link}) · ${Math.round(f.size / 1024 / 1024 * 10) / 10} MB`);
  lines.push('');
}
if (loose.length || unknownFolders.length) {
  lines.push('### Not in a known subfolder (move them in Drive and the next import picks them up)', '');
  for (const f of loose) lines.push(`- [${f.name}](${f.link})`);
  for (const n of unknownFolders) lines.push(`- folder "${n}"`);
  lines.push('');
}
if (imported.length) {
  lines.push('### Before merging (Claude does this in the pull request, a person approves)', '');
  lines.push('- [ ] Look at every photo. Remove any that show a customer, a house number, a car plate, paperwork with names, or another company\'s van or logo.');
  lines.push('- [ ] Rename the keepers to say what they show (`dryer-repair-aurora-kitchen.webp`) and write alt text for each.');
  lines.push('- [ ] Put them on the site through `site.json` (`media.hero`, `team`, `gallery`, `credentials`, `partners`) and services.json `image`; set `placeholder: false` where a stock photo is replaced.');
  lines.push('- [ ] Team photos only with the person\'s consent and the first name and role from the client.');
  lines.push('- [ ] When a file is renamed or deleted, keep its entry in `docs/growth/drive-imported.json` (with the new path) so the next import does not bring it back.');
  lines.push('- [ ] `npm run build` passes.');
  lines.push('');
}
writeFileSync(REPORT, lines.join('\n'));
console.log(lines.join('\n'));
out('imported', imported.length);
out('skipped', 'false');
