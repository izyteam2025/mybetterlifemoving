# Playbook: copy formats and the blog standard

Part of the starter rules, moved out of CLAUDE.md so it loads only when a task needs it. CLAUDE.md still holds the rules that apply to every change and wins on any conflict.

## Blog standard (blog-content SOP, enforced)

Frontmatter: `title` (H1, contains the target keyword), `metaTitle` (50 to 60 chars), `metaDescription` (150 to 160 chars), `targetKeyword`, `secondaryKeywords`, `date`, `updated`, `author` (slug in `content/authors.json`: a real person with a role, never "the team"), `services` and `cities` tags, and `type` (the article type for the blog filters: `troubleshooting`, `cost-guide`, `maintenance`, `repair-or-replace`, `local`, `news`; add client-specific ones in `site.blog.types`).

Body, in order: intro 80 to 120 words with the keyword in the first paragraph; `## Key Takeaways` (4 to 6 bullets); On This Page is generated automatically from the H2s, right after Key Takeaways (do not write it); body sections with search-style H2s; `## Frequently Asked Questions` with 4 to 6 `###` questions, each answer opening with a direct 40 to 60 word paragraph; a conclusion with one CTA link to the conversion page and the phone as a `tel:` link. Headings in Title Case. 5 to 7 sections in total.

**Blog hub on every site (Artem 3 Nov 2026).** `/blog/` lists every live post and guide in one list, newest first, with filters by location, service and type. It is in the About dropdown and the footer. Guides are extra pages that are not dated posts (cost guides, how-tos): set `"guide": true` plus `services`, `cities` and `type` in their copy file and the hub lists them. Untagged by city means general advice, shown under every location. The filters hide cards in the browser only: every card stays in the HTML, there are no filtered URLs to index, and the canonical stays `/blog/`. A filter row shows once it has two or more values. The hub goes live with the first live post or guide (copy in `content/pages/blog.json`: `hero`, optional `filters` labels).

Links: 3 to 5 internal with varied anchors, never the same anchor twice; 3 to 6 outbound links to verified, recent, credible non-competitor sources, placed on the claim they support, one per domain (competitors are listed in `site.competitors`). Outbound links open in a new tab with `rel="noopener"` automatically and stay dofollow. `npm run links:external` checks they still resolve.

## Copy formats

All strings accept inline Markdown: `[anchor](/path/)`, `**bold**`. Every copy file has `updated` (YYYY-MM-DD; feeds sitemap lastmod and dateModified) and `meta.description` (120 to 160 chars), optionally `publishDate` (YYYY-MM-DD, see Scheduled publishing), and gets `factCheck { by, date }` once a person has checked it.

**Main service** (`services/<slug>.json`)
```json
{
  "updated": "2026-10-28",
  "meta": { "description": "..." },
  "hero": { "overview": ["Carries the exact primary keyword once."], "sellingPoints": ["...", "...", "..."], "ctaLabel": "..." },
  "serviceBlock": { "h2": "...", "intro": "...", "cards": [{ "title": "...", "text": "..." }], "ctaLabel": "..." },
  "areas": { "intro": "Opens on the target city, then one sentence on the other cities." },
  "process": { "h2": "...", "steps": [{ "title": "...", "text": "..." }] },
  "whyChoose": { "h2": "...", "cards": [{ "title": "...", "text": "..." }] },
  "reviews": { "heading": "..." },
  "faqHeading": "...",
  "faq": [{ "q": "...?", "a": "..." }],
  "faqClosing": "Two short sentences ending with what the FAQ page covers.",
  "closing": { "h2": "...", "body": "...", "ctaLabel": "Book [Primary Keyword] in [City]" }
}
```
The service areas H2 (`[Primary Keyword] in [City] and Nearby Cities`) and its city tiles are generated.

**City** (`cities/<slug>.json`): `hero`, `servicesBlock { h2, intro }` (the intro carries ZIPs and neighbourhoods from the files, in words), optional `serviceCards { "<service>": "..." }`, optional `brandsBlock { h2, intro }` (brand clients only), `whyChoose`, optional `reviews`, `faqHeading`, `faq`, `closing`.

**City service** (`city-services/<city>/<service>.json`): `hero` (short sentences, 12 words max each), `problems { h2, intro, cards[4] }`, `whyChoose { h2, cards[4-5] }`, `reviews`, `faqHeading`, `faq`, `closing`.

**County** (`counties/<slug>.json`): `hero` (two overview paragraphs), `areasBlock { h2, intro, closing }`, `servicesBlock { h2, intro }`, `whyChoose`, `reviews`, `faq`, `closing`.

**Hubs** (`services.json`, `service-area.json`): `hero` (with `h1`), `servicesBlock`, `locationsBlock { h2, intro, closing }`, `reviews`, `faq`, `faqClosing`, `closing`.

**Home**: `hero { h1, overview }` (eyebrow and support line come from `site.json`), `servicesBlock`, `notSureTile`, optional `brandsBlock`, `sections`, `reviews`, `areasBlock`, optional `latestPosts`, `faq` (five), `faqClosing`, `closing` (slogan comes from `site.slogan`).

**Brand**: `hero { h1, ... }`, `serviceBlock`, `process`, `whyChoose`, `reviews`, `faq` (with the authorization question), `faqClosing`, `closing`. Sister brands come from `brands.json`.

**FAQ page**: `hero`, `groups [{ h2, faq [] }]`, `closing`. **Extra pages**: `hero`, `intro`, `sections`, optional `form: true`, optional `noindex: true`, optional `guide: true` with `services`, `cities`, `type` (listed on the blog hub). **Reviews page**: stays noindex automatically until `site.reviewsWidget.id` is set, then indexes itself.
