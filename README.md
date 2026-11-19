# IZY Site Starter v0.2

Starter for SEO-first home-services websites at IZY Digital / ProsBuddy, built with [Astro](https://astro.build): static HTML, no client JavaScript, every client difference in `content/`.

**Read [`CLAUDE.md`](./CLAUDE.md)** first. It holds the rules every change follows (URL standard, linking matrix, on-page, AEO, gate). Task playbooks (copy formats and blog, new site, live-site updates) are in [`docs/playbooks/`](./docs/playbooks/) and are read only when a task needs them.

## What is built in

**Architecture (client-site-mapping).** Keyword-only URLs: `/dryer-repair/`, `/austin/appliance-repair/`, `/austin/dryer-repair/`, optional counties `/travis-county/appliance-repair/` and brand pages `/sub-zero-appliance-repair/`. Hubs at `/services/` and `/service-area/`. Menu by buyer question with no Home item, every dropdown parent a real hub, Service Area listing every city alphabetically, one CTA. Footer with NAP, hours, social, services, cities, blog, privacy and terms. Breadcrumbs mirror the tree. Folder roots 301 to their page.

**Page templates (agency copy skills).** Every page type follows its skill's block order: hero, numbers section, promotion and offer block, then the type-specific blocks, reviews, FAQ with closing CTA, final CTA. H1 formats are generated so they cannot drift.

**Internal linking.** Generated from the data and enforced per page type: service pages link down to their city service pages, city pages only to their own city service pages, city service pages through CTAs only, hubs to every main service and city, homepage one level deep.

**Schema.** One `@graph` per page with stable `@id`s: LocalBusiness (dual `@type`, Wikipedia and Productontology `additionalType`, `hasOfferCatalog`, `areaServed`, GBP in `sameAs`), WebSite, WebPage with `dateModified`, BreadcrumbList, Service (with `areaServed` City or county), FAQPage, BlogPosting with a Person author.

**AEO / GEO.** Visible question-format FAQs matched word for word by schema; one wording per fact enforced across the site; blog template with Key Takeaways, generated On This Page with descriptive jump-link ids, named author with bio, visible published and updated dates; `robots.txt` naming AI search crawlers; generated `llms.txt`; IndexNow after every deploy; static HTML that AI crawlers can read without JavaScript.

**Technical.** Canonicals, sitemap with real `lastmod`, trailing-slash URLs, inline CSS, OG image, security and cache headers, `_redirects`, required alt text, mobile call/CTA bar.

## The gate

`npm run build` = `validate-content` → `astro build` → `postbuild` (redirects, IndexNow key) → `seo-check`.

Blocks the deploy (errors), among others: URL standard violations, body links that break the page type's linking rules, missing required links, H1 not in the standard format, title over 60 characters or off format, missing or duplicate titles, descriptions and H1s, wrong canonical, broken internal links or links through a redirect, orphan pages, em dashes, ZIP codes in the hero, personal names outside About, banned compliance phrases, a phone or warranty term that contradicts `site.json`, FAQ questions reused across pages, FAQ schema not matching the visible FAQ, shared sentences between a main service page and its target-city city service page, blog structure (Key Takeaways, On This Page, FAQ count and 40 to 60 word answers, Title Case, author, dates), blog links (3+ internal, 3 to 8 outbound, one per domain, no competitors, no `utm_`), cannibalized primary keywords, sitemap or robots problems, AI crawlers blocked.

Warnings (do not block): copy length against the skill's word range, FAQ count, meta description outside 120 to 160, missing primary keyword in H1 or title, fewer than ten reviews.

The demo content passes the gate; its remaining warnings are copy length, because the demo copy is shorter than the agency standard.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # what CI and the host run
```

Node 22 or newer.

## Deploy (Cloudflare Pages)

1. One GitHub repo per client, created from this template.
2. Cloudflare Pages: connect the repo; build command `npm run build`; output `dist`; env `NODE_VERSION=22` and `INDEXNOW_KEY`.
3. Every PR gets a preview URL; merging to `main` deploys. A failing gate blocks the deploy.
4. GitHub: protect `main` (PR required, **SEO gate** check required, CODEOWNERS review for `src/`, `scripts/` and site-wide content).
5. **Cloudflare > Security > Bots / AI Crawl Control: do not block AI search crawlers.**
6. Add the `INDEXNOW_KEY` secret in GitHub for the IndexNow workflow.

## Demo content

A fictional client (Northline Appliance Repair, `northline-demo.com`, 555 number) shows every page type working: home, both hubs, two service pages, a county, two cities, three city service pages, a brand hub and brand page, About, FAQ, Reviews, Contact, blog with one SOP-compliant article, privacy and terms. Replace all of it for a real client.

## Roadmap

- Git-based visual editor (Keystatic or TinaCMS) over the same `content/` files.
- Image pipeline per client (`src/assets/`, `<Img>` with required alt) for hero, problem and service cards.
- Lighthouse CI budgets.
- Optional custom MCP tools (`add_city`, `update_offer`) once the workflow settles.
