import { loadContent } from '../lib/content.mjs';

// AI search and assistant crawlers are named explicitly so they are never blocked by
// accident. Set site.aiCrawlers to "block-training" to keep search/answer bots but
// refuse model-training crawlers (GPTBot, Google-Extended, CCBot, Applebot-Extended).
// NOTE: Cloudflare can block AI bots at the edge regardless of this file
// (Security > Bots / AI Crawl Control). Check it on every launch.
const SEARCH_AND_ANSWER = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'Bingbot', 'Googlebot', 'Applebot', 'DuckAssistBot'];
const TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent'];

export function GET() {
  const { site } = loadContent();
  const blockTraining = site.aiCrawlers === 'block-training';
  const lines = ['# Search engines and AI answer engines: welcome.'];
  for (const ua of SEARCH_AND_ANSWER) lines.push(`User-agent: ${ua}`, 'Allow: /', '');
  for (const ua of TRAINING) lines.push(`User-agent: ${ua}`, blockTraining ? 'Disallow: /' : 'Allow: /', '');
  lines.push('User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap.xml', site.url).href}`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain' } });
}
