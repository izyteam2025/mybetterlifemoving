import { livePages, loadContent, updatedFor, noindexFor } from '../lib/content.mjs';

// Every live, indexable page, from the same registry as the routes. lastmod comes
// from the copy's "updated" field (blog: frontmatter), so it only moves when the
// content really changed (Google and Bing ignore lastmod that is always "now").
export function GET() {
  const { site } = loadContent();
  const urls = livePages()
    .filter((p) => !noindexFor(p))
    .map((p) => {
      const lastmod = updatedFor(p);
      return `  <url><loc>${new URL(p.path, site.url).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    })
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
