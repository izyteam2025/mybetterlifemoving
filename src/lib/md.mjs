import { marked, Marked } from 'marked';
import { slugify } from './routes.mjs';

import { loadContent } from './content.mjs';

// Copy fields may use inline Markdown: [links](/path/), **bold**, *italic*.
// The business phone number written in plain copy becomes a tap-to-call tel: link
// automatically (mobile conversions), unless it is already inside a link.
export const inline = (text = '') => {
  const html = marked.parseInline(String(text));
  const { site } = loadContent();
  if (!site?.phone || !site?.phoneE164) return html;
  const parts = html.split(/(<a\b[^>]*>.*?<\/a>)/s);
  return parts.map((part) => (part.startsWith('<a') ? part : part.split(site.phone).join(`<a href="tel:${site.phoneE164}">${site.phone}</a>`))).join('');
};

export const plain = (s = '') => String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Blog post renderer (blog-content standard):
// - every heading gets a descriptive id slugged from its text (jump links)
// - "On This Page" is generated from the H2s and placed right after Key Takeaways
//   (a hand-written one is replaced, so labels always mirror the headings exactly)
// - FAQ questions (H3 under the FAQ H2) and their answers are extracted for FAQPage schema
// - outbound links open in a new tab with rel="noopener" and stay dofollow
// - a stray H1 in the body is demoted to H2 (the template owns the H1)
export function renderPost(body, siteUrl) {
  const host = new URL(siteUrl).host;
  const m = new Marked();
  const tokens = m.lexer(String(body));

  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading' && t.depth <= 2 && /^on this page$/i.test(t.text.trim())) {
      i++;
      while (i < tokens.length && tokens[i].type !== 'heading') i++;
      i--;
      continue;
    }
    out.push(t);
  }
  out.links = tokens.links;

  const ids = new WeakMap();
  const used = new Set();
  for (const t of out) {
    if (t.type !== 'heading') continue;
    let id = slugify(plain(t.text)) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id);
    ids.set(t, id);
  }

  const isKT = (t) => t.type === 'heading' && t.depth <= 2 && /^key takeaways$/i.test(t.text.trim());
  const h2s = out.filter((t) => t.type === 'heading' && t.depth <= 2 && !isKT(t)).map((t) => ({ id: ids.get(t), text: plain(t.text) }));

  // Key Takeaways bullet count
  const ktIndex = out.findIndex(isKT);
  let takeaways = 0;
  let insertAt = -1;
  if (ktIndex >= 0) {
    const listIdx = out.findIndex((t, i) => i > ktIndex && t.type === 'list');
    const nextHeading = out.findIndex((t, i) => i > ktIndex && t.type === 'heading');
    if (listIdx > 0 && (nextHeading < 0 || listIdx < nextHeading)) {
      takeaways = out[listIdx].items.length;
      insertAt = listIdx + 1;
    } else insertAt = ktIndex + 1;
  } else {
    insertAt = Math.max(0, out.findIndex((t) => t.type === 'heading'));
  }
  const tocHtml = `<nav class="toc" aria-labelledby="on-this-page"><h2 id="on-this-page">On This Page</h2><ul>${h2s.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ul></nav>\n`;
  out.splice(insertAt, 0, { type: 'html', block: true, raw: tocHtml, text: tocHtml, pre: false });

  // FAQ extraction
  const faq = [];
  const faqIdx = out.findIndex((t) => t.type === 'heading' && t.depth === 2 && /frequently asked questions|^faqs?$/i.test(t.text.trim()));
  if (faqIdx >= 0) {
    let current = null;
    for (let i = faqIdx + 1; i < out.length; i++) {
      const t = out[i];
      if (t.type === 'heading' && t.depth <= 2) break;
      if (t.type === 'heading' && t.depth === 3) { current = { q: plain(t.text), a: '' }; faq.push(current); continue; }
      if (current && (t.type === 'paragraph' || t.type === 'list')) current.a = `${current.a} ${plain(t.raw)}`.trim();
    }
  }

  m.use({
    renderer: {
      heading(token) {
        const depth = Math.max(2, token.depth);
        return `<h${depth} id="${ids.get(token) ?? slugify(plain(token.text))}">${this.parser.parseInline(token.tokens)}</h${depth}>\n`;
      },
      link(token) {
        const text = this.parser.parseInline(token.tokens);
        const title = token.title ? ` title="${esc(token.title)}"` : '';
        let external = false;
        try { external = /^https?:\/\//.test(token.href) && new URL(token.href).host !== host; } catch {}
        return `<a href="${esc(token.href)}"${title}${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      },
    },
  });

  return { html: m.parser(out), h2s, faq, takeaways };
}
