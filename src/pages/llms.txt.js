import { livePages, loadContent, h1For, descriptionFor, noindexFor } from '../lib/content.mjs';

// /llms.txt (llmstxt.org format): a plain-text map of the business and its key pages
// for AI assistants. Cheap to ship, generated from the same registry as the site,
// so it is never out of date. Facts come from site.json only.
export function GET() {
  const { site, cities } = loadContent();
  const pages = livePages().filter((p) => !noindexFor(p));
  const url = (p) => new URL(p.path, site.url).href;
  const section = (title, types) => {
    const list = pages.filter((p) => types.includes(p.type));
    return list.length ? [`## ${title}`, '', ...list.map((p) => `- [${h1For(p)}](${url(p)}): ${descriptionFor(p) ?? ''}`), ''] : [];
  };
  const f = site.fixedFacts ?? {};
  const out = [
    `# ${site.name}`,
    '',
    `> ${site.summary ?? ''}`,
    '',
    `- Phone: ${site.phone}`,
    `- Address: ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`,
    f.hours ? `- Hours: ${f.hours}` : null,
    f.warranty ? `- Warranty: ${f.warranty}` : null,
    `- Service area: ${cities.map((c) => c.name).join(', ')}`,
    site.rating?.value ? `- Google rating: ${site.rating.value} from ${site.rating.count}+ reviews` : null,
    '',
    ...section('Services', ['service', 'brand']),
    ...section('Service area', ['county', 'city']),
    ...section('Help', ['faq', 'reviews', 'about', 'contact']),
    ...section('Guides', ['blog-post']),
  ].filter((l) => l !== null);
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
